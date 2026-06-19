import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Character, CharacterService } from '../../services/character.service';
import { BackButton } from '../back-button/back-button';

interface HistoryPoint {
  date: Date;
  dateKey: string;
  count: number;
}

interface CharacterHistorySeries {
  character: Character;
  points: HistoryPoint[];
}

@Component({
  selector: 'app-chat-history-chart',
  imports: [CommonModule, FormsModule, BackButton],
  templateUrl: './chat-history-chart.html',
  styleUrl: './chat-history-chart.scss'
})
export class ChatHistoryChart {
  private readonly chartWidth = 1100;
  private readonly plotLeft = 200;
  private readonly plotRight = 1070;
  private readonly rowHeight = 72;
  private readonly topPadding = 32;
  private readonly bottomPadding = 70;
  private readonly droughtStart = new Date('2026-04-21T12:00:00');
  private readonly droughtEnd = new Date('2026-05-06T12:00:00');
  private readonly historyPointsByCharacterId = new Map<number, HistoryPoint[]>();
  private datasetDateExtent: [Date, Date] = [new Date(), new Date()];

  characters: Character[] = [];
  datasetStartDate = '';
  datasetEndDate = '';
  selectedStartDate = '';
  selectedEndDate = '';
  searchTerm = '';
  series: CharacterHistorySeries[] = [];
  isLoading = true;

  constructor(private characterService: CharacterService) {
    this.loadCharacters();
  }

  get availableCharacters(): Character[] {
    const selectedIds = new Set(this.series.map(item => item.character.id));
    return this.characters.filter(
      character => !selectedIds.has(character.id) && this.historyCount(character.id) > 0
    );
  }

  get searchResults(): Character[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return [];
    const isIdQuery = /^\d+$/.test(query);

    return this.availableCharacters
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

  visibleHistoryCount(item: CharacterHistorySeries): number {
    return item.points
      .filter(point => this.isDateVisible(point.date))
      .reduce((total, point) => total + point.count, 0);
  }

  get chartHeight(): number {
    return this.topPadding + this.series.length * this.rowHeight + this.bottomPadding;
  }

  get chartViewBox(): string {
    return `0 0 ${this.chartWidth} ${this.chartHeight}`;
  }

  get axisY(): number {
    return this.topPadding + this.series.length * this.rowHeight;
  }

  get dateTicks(): Date[] {
    const [start, end] = this.dateExtent;
    const tickCount = 6;
    const span = end.getTime() - start.getTime();

    if (span === 0) return [start];

    return Array.from(
      { length: tickCount },
      (_, index) => new Date(start.getTime() + span * (index / (tickCount - 1)))
    );
  }

  get showDrought(): boolean {
    const [start, end] = this.dateExtent;
    return this.droughtStart <= end && this.droughtEnd >= start;
  }

  get droughtStartX(): number {
    return Math.max(this.plotLeft, this.dateX(this.droughtStart));
  }

  get droughtEndX(): number {
    return Math.min(this.plotRight, this.dateX(this.droughtEnd));
  }

  get droughtY(): number {
    return this.topPadding;
  }

  get droughtHeight(): number {
    return this.axisY - this.topPadding;
  }

  get droughtLabelY(): number {
    return this.topPadding + 14;
  }

  get plotStartX(): number {
    return this.plotLeft;
  }

  get plotEndX(): number {
    return this.plotRight;
  }

  get isFullDateRange(): boolean {
    return (
      this.selectedStartDate === this.datasetStartDate &&
      this.selectedEndDate === this.datasetEndDate
    );
  }

  addCharacter(character = this.searchResults[0]) {
    if (
      !character ||
      this.historyCount(character.id) === 0 ||
      this.series.some(item => item.character.id === character.id)
    ) return;

    this.series = [
      ...this.series,
      this.createSeries(character)
    ];
    this.searchTerm = '';
  }

  addAllCharacters() {
    this.series = [
      ...this.series,
      ...this.availableCharacters.map(character => this.createSeries(character))
    ];
    this.searchTerm = '';
  }

  removeCharacter(characterId: number) {
    this.series = this.series.filter(item => item.character.id !== characterId);
  }

  clearCharacters() {
    this.series = [];
  }

  updateStartDate(value: string) {
    this.selectedStartDate = this.clampDateKey(
      value || this.datasetStartDate,
      this.datasetStartDate,
      this.selectedEndDate
    );
    this.removeCharactersWithoutVisibleHistory();
  }

  updateEndDate(value: string) {
    this.selectedEndDate = this.clampDateKey(
      value || this.datasetEndDate,
      this.selectedStartDate,
      this.datasetEndDate
    );
    this.removeCharactersWithoutVisibleHistory();
  }

  resetDateRange() {
    this.selectedStartDate = this.datasetStartDate;
    this.selectedEndDate = this.datasetEndDate;
  }

  isDateVisible(date: Date): boolean {
    const [start, end] = this.dateExtent;
    return date >= start && date <= end;
  }

  rowY(index: number): number {
    return this.topPadding + index * this.rowHeight + this.rowHeight / 2;
  }

  dateX(date: Date): number {
    const [start, end] = this.dateExtent;
    const span = end.getTime() - start.getTime();
    const ratio = span === 0 ? 0.5 : (date.getTime() - start.getTime()) / span;
    return this.plotLeft + ratio * (this.plotRight - this.plotLeft);
  }

  pointColor(index: number): string {
    const colors = ['#2563eb', '#db2777', '#059669', '#d97706', '#7c3aed', '#0891b2', '#dc2626'];
    return colors[index % colors.length];
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  formatMonthDay(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  formatYear(date: Date): string {
    return String(date.getFullYear());
  }

  private get dateExtent(): [Date, Date] {
    if (!this.selectedStartDate || !this.selectedEndDate) return this.datasetDateExtent;
    return [this.dateFromKey(this.selectedStartDate), this.dateFromKey(this.selectedEndDate)];
  }

  private loadCharacters() {
    forkJoin({
      characters: this.characterService.getCharactersPlusCriticizer(),
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
        this.resetDateRange();
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

  private removeCharactersWithoutVisibleHistory() {
    this.series = this.series.filter(item => this.visibleHistoryCount(item) > 0);
  }

  private clampDateKey(value: string, minimum: string, maximum: string): string {
    return value < minimum ? minimum : value > maximum ? maximum : value;
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
