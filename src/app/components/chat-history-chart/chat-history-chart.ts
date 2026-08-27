import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Character, CharacterService } from '../../services/character.service';
import { CharacterModal } from '../character-modal/character-modal';
import { HistoryCharacterPicker } from './character-picker/character-picker';
import { HistoryChartControls } from './chart-controls/chart-controls';
import { HistoryDateRange } from './date-range/date-range';
import { HistoryDataPlot } from './history-data-plot/history-data-plot';

export interface HistoryPoint {
  date: Date;
  dateKey: string;
  count: number;
  endDate?: Date;
}

export interface CharacterHistorySeries {
  character: Character;
  points: HistoryPoint[];
}

export interface HistoryEra {
  label: string;
  start: Date;
  end: Date;
  className: string;
}

type HistorySortField = 'added' | 'name' | 'id' | 'count' | 'first' | 'latest';
type SortDirection = 'asc' | 'desc';
type SlidingZoomLevel = 7 | 15 | 30 | 60 | 120;
type ZoomLevel = SlidingZoomLevel | 'full' | 'custom';

@Component({
  selector: 'app-chat-history-chart',
  imports: [
    CommonModule,
    CharacterModal,
    HistoryCharacterPicker,
    HistoryDateRange,
    HistoryChartControls,
    HistoryDataPlot
  ],
  templateUrl: './chat-history-chart.html',
  styleUrl: './chat-history-chart.scss'
})
export class ChatHistoryChart {
  private readonly historyPointsByCharacterId = new Map<number, HistoryPoint[]>();
  private displayedSeriesCache: CharacterHistorySeries[] = [];
  private displayedSeriesCacheKey = '';
  private readonly visibleCountCache = new Map<string, number>();
  private seriesVersion = 0;
  private datasetDateExtent: [Date, Date] = [new Date(), new Date()];

  characters: Character[] = [];
  selectedCharacter: Character | null = null;
  datasetStartDate = '';
  datasetEndDate = '';
  selectedStartDate = '';
  selectedEndDate = '';
  searchTerm = '';
  statusFilter = 'all';
  sortBy: HistorySortField = 'added';
  sortDirection: SortDirection = 'asc';
  zoomLevel: ZoomLevel = 'full';
  series: CharacterHistorySeries[] = [];
  isLoading = true;

  constructor(private characterService: CharacterService) {
    this.loadCharacters();
  }

  get availableCharacters(): Character[] {
    const selectedIds = new Set(this.series.map(item => item.character.id));
    return this.characters.filter(character => !selectedIds.has(character.id));
  }

  get availableCharactersWithVisibleHistory(): Character[] {
    return this.availableCharacters.filter(character => this.historyCount(character.id) > 0);
  }

  get searchResults(): Character[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return [];
    const isIdQuery = /^\d+$/.test(query);

    return this.characters
      .filter(
        character =>
          isIdQuery
            ? String(character.id) === query
            : character.shortName.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        const aExact = String(a.id) === query || a.shortName.toLowerCase() === query;
        const bExact = String(b.id) === query || b.shortName.toLowerCase() === query;
        if (aExact !== bExact) return aExact ? -1 : 1;
        return a.shortName.localeCompare(b.shortName);
      })
      .slice(0, 12);
  }

  historyCount(characterId: number): number {
    return this.getHistoryPoints(characterId)
      .filter(point => this.isDateVisible(point.date))
      .reduce((total, point) => total + point.count, 0);
  }

  isCharacterSelected(characterId: number): boolean {
    return this.series.some(item => item.character.id === characterId);
  }

  visibleHistoryCount(item: CharacterHistorySeries): number {
    const cacheKey = `${item.character.id}|${this.selectedStartDate}|${this.selectedEndDate}`;
    const cached = this.visibleCountCache.get(cacheKey);
    if (cached !== undefined) return cached;
    const count = item.points
      .filter(point => this.isDateVisible(point.date))
      .reduce((total, point) => total + point.count, 0);
    this.visibleCountCache.set(cacheKey, count);
    return count;
  }

  get displayedSeries(): CharacterHistorySeries[] {
    const cacheKey = this.displayStateKey;
    if (cacheKey === this.displayedSeriesCacheKey) return this.displayedSeriesCache;

    const filtered = this.series.filter(item =>
      this.statusFilter === 'all' || item.character.status === this.statusFilter
    );
    if (this.sortBy === 'added') {
      this.displayedSeriesCache = this.sortDirection === 'asc' ? filtered : [...filtered].reverse();
      this.displayedSeriesCacheKey = cacheKey;
      return this.displayedSeriesCache;
    }

    this.displayedSeriesCache = [...filtered].sort((a, b) => {
      let result = 0;
      switch (this.sortBy) {
        case 'name': result = a.character.shortName.localeCompare(b.character.shortName); break;
        case 'id': result = a.character.id - b.character.id; break;
        case 'count': result = this.visibleHistoryCount(a) - this.visibleHistoryCount(b); break;
        case 'first': result = this.visibleActivityTime(a, false) - this.visibleActivityTime(b, false); break;
        case 'latest': result = this.visibleActivityTime(a, true) - this.visibleActivityTime(b, true); break;
      }
      return (this.sortDirection === 'asc' ? result : -result) ||
        a.character.shortName.localeCompare(b.character.shortName);
    });
    this.displayedSeriesCacheKey = cacheKey;
    return this.displayedSeriesCache;
  }

  get availableStatuses(): string[] {
    return Array.from(new Set(this.series.map(item => item.character.status)))
      .sort((a, b) => a.localeCompare(b));
  }

  get hasCharactersWithoutVisibleHistory(): boolean {
    return this.series.some(item => this.visibleHistoryCount(item) === 0);
  }

  addCharacter(character = this.searchResults[0]) {
    if (character && this.isCharacterSelected(character.id)) {
      this.removeCharacter(character.id);
      this.searchTerm = '';
      return;
    }

    if (
      !character ||
      this.series.some(item => item.character.id === character.id)
    ) return;

    this.series = [
      ...this.series,
      this.createSeries(character)
    ];
    this.seriesVersion++;
    this.searchTerm = '';
  }

  addAllCharacters() {
    this.series = [
      ...this.series,
      ...this.availableCharactersWithVisibleHistory
        .map(character => this.createSeries(character))
    ];
    this.seriesVersion++;
    this.sortBy = 'count';
    this.sortDirection = 'desc';
    this.searchTerm = '';
  }

  removeCharacter(characterId: number) {
    this.series = this.series.filter(item => item.character.id !== characterId);
    this.seriesVersion++;
  }

  clearCharacters() {
    this.series = [];
    this.seriesVersion++;
    this.statusFilter = 'all';
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  }

  isDateVisible(date: Date): boolean {
    const [start, end] = this.dateExtent;
    return date >= start && date <= end;
  }

  private get dateExtent(): [Date, Date] {
    if (!this.selectedStartDate || !this.selectedEndDate) return this.datasetDateExtent;
    return [this.dateFromKey(this.selectedStartDate), this.dateFromKey(this.selectedEndDate)];
  }

  private get displayStateKey(): string {
    return [
      this.seriesVersion,
      this.selectedStartDate,
      this.selectedEndDate,
      this.statusFilter,
      this.sortBy,
      this.sortDirection
    ].join('|');
  }

  private loadCharacters() {
    forkJoin({
      characters: this.characterService.getCharacters(),
      chatGPT: this.characterService.getChatGPT()
    }).subscribe(({ characters, chatGPT }) => {
      this.characters = [...characters, ...chatGPT]
        .filter(character => this.hasHistory(character.id))
        .sort((a, b) => a.name.localeCompare(b.name));
      const datasetDates = this.characters.flatMap(character =>
        this.getHistoryPoints(character.id).map(point => point.date.getTime())
      );
      if (datasetDates.length > 0) {
        const minimum = Math.min(...datasetDates);
        const maximum = Math.max(...datasetDates);
        this.datasetDateExtent = [new Date(minimum), new Date(maximum)];
        this.datasetStartDate = this.toDateKey(this.datasetDateExtent[0]);
        this.datasetEndDate = this.toDateKey(this.datasetDateExtent[1]);
        this.zoomLevel = 'full';
        this.selectedStartDate = this.datasetStartDate;
        this.selectedEndDate = this.datasetEndDate;
      }
      this.isLoading = false;
    });
  }

  private hasHistory(characterId: number): boolean {
    return this.getHistoryTimestamps(characterId).length > 0;
  }

  private createSeries(character: Character): CharacterHistorySeries {
    return {
      character,
      points: this.getHistoryPoints(character.id)
    };
  }

  removeCharactersWithoutVisibleHistory() {
    const visibleSeries = this.series.filter(item => this.visibleHistoryCount(item) > 0);
    if (visibleSeries.length !== this.series.length) this.seriesVersion++;
    this.series = visibleSeries;
  }

  private visibleActivityTime(item: CharacterHistorySeries, latest: boolean): number {
    const points = item.points.filter(point => this.isDateVisible(point.date));
    if (points.length === 0) return 0;
    return points[latest ? points.length - 1 : 0].date.getTime();
  }

  private dateFromKey(dateKey: string): Date {
    return new Date(`${dateKey}T12:00:00`);
  }

  private toDateKey(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  private getHistoryPoints(characterId: number): HistoryPoint[] {
    const cachedPoints = this.historyPointsByCharacterId.get(characterId);
    if (cachedPoints) return cachedPoints;

    const countsByDate = new Map<string, number>();

    this.getHistoryTimestamps(characterId).forEach(timestamp => {
      const date = new Date(timestamp);
      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');
      countsByDate.set(dateKey, (countsByDate.get(dateKey) ?? 0) + 1);
    });

    const points = Array.from(countsByDate, ([dateKey, count]) => ({
      dateKey,
      count,
      date: new Date(`${dateKey}T12:00:00`)
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
    this.historyPointsByCharacterId.set(characterId, points);
    return points;
  }

  private getHistoryTimestamps(characterId: number): string[] {
    const value = localStorage.getItem(`chatLinkHistory_${characterId}`);
    if (!value) return [];

    try {
      const history: unknown = JSON.parse(value);
      if (!Array.isArray(history)) return [];
      return history.filter(
        (timestamp): timestamp is string =>
          typeof timestamp === 'string' && !Number.isNaN(new Date(timestamp).getTime())
      );
    } catch {
      return [];
    }
  }
}
