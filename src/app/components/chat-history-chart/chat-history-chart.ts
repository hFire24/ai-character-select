import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Character, CharacterService } from '../../services/character.service';
import { CharacterModal } from '../character-modal/character-modal';

interface HistoryPoint {
  date: Date;
  dateKey: string;
  count: number;
  endDate?: Date;
}

interface CharacterHistorySeries {
  character: Character;
  points: HistoryPoint[];
}

interface HistoryEra {
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
  imports: [CommonModule, FormsModule, CharacterModal],
  templateUrl: './chat-history-chart.html',
  styleUrl: './chat-history-chart.scss'
})
export class ChatHistoryChart {
  private readonly chartWidth = 1100;
  private readonly plotLeft = 200;
  private readonly plotRight = 1070;
  private readonly rowHeight = 60;
  private readonly firstRowHeight = 70;
  private readonly topPadding = 52;
  private readonly bottomPadding = 24;
  private readonly droughtStart = new Date('2026-04-21T12:00:00');
  private readonly droughtEnd = new Date('2026-05-06T12:00:00');
  private readonly historyPointsByCharacterId = new Map<number, HistoryPoint[]>();
  private readonly displayedPointsCache = new Map<string, HistoryPoint[]>();
  private displayedSeriesCache: CharacterHistorySeries[] = [];
  private displayedSeriesCacheKey = '';
  private histogramMaximumCache = 1;
  private histogramMaximumCacheKey = '';
  private readonly visibleCountCache = new Map<string, number>();
  private readonly characterColorCache = new Map<number, string>();
  private characterColorCacheVersion = -1;
  private histogramGeometryCacheKey = '';
  private histogramGeometryCache = { bucketDays: 1, bucketCount: 1, barWidth: 1 };
  private readonly dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
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
    return this.characters.filter(
      character => !selectedIds.has(character.id) && this.historyCount(character.id) > 0
    );
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

  displayedPoints(item: CharacterHistorySeries): HistoryPoint[] {
    const [rangeStart, rangeEnd] = this.dateExtent;
    const dayMilliseconds = 24 * 60 * 60 * 1000;
    const dayNumber = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / dayMilliseconds;
    const addDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };
    const inclusiveDays = dayNumber(rangeEnd) - dayNumber(rangeStart) + 1;
    const bucketDays = this.histogramBucketDays(inclusiveDays);
    const cacheKey = `${item.character.id}|${this.toDateKey(rangeStart)}|${this.toDateKey(rangeEnd)}|${bucketDays}`;
    const cached = this.displayedPointsCache.get(cacheKey);
    if (cached) return cached;
    const buckets = new Map<number, HistoryPoint>();

    item.points.filter(point => this.isDateVisible(point.date)).forEach(point => {
      const dayOffset = dayNumber(point.date) - dayNumber(rangeStart);
      const bucketIndex = Math.floor(dayOffset / bucketDays);
      const bucketStart = addDays(rangeStart, bucketIndex * bucketDays);
      const proposedEnd = addDays(bucketStart, bucketDays - 1);
      const bucketEnd = proposedEnd > rangeEnd ? new Date(rangeEnd) : proposedEnd;
      const existing = buckets.get(bucketIndex);
      if (existing) {
        existing.count += point.count;
      } else {
        buckets.set(bucketIndex, {
          date: bucketStart,
          endDate: bucketEnd,
          dateKey: `${this.toDateKey(bucketStart)}-${this.toDateKey(bucketEnd)}`,
          count: point.count
        });
      }
    });

    const points = Array.from(buckets.values());
    this.displayedPointsCache.set(cacheKey, points);
    return points;
  }

  formatPointDate(point: HistoryPoint): string {
    if (!point.endDate || point.date.getTime() === point.endDate.getTime()) {
      return this.formatDate(point.date);
    }
    return `${this.formatDate(point.date)}–${this.formatDate(point.endDate)}`;
  }

  get chartHeight(): number {
    return this.axisY + this.bottomPadding;
  }

  get chartViewBox(): string {
    return `0 0 ${this.chartWidth} ${this.chartHeight}`;
  }

  get axisY(): number {
    if (this.displayedSeries.length === 0) return this.topPadding;
    return this.topPadding + this.firstRowHeight +
      (this.displayedSeries.length - 1) * this.rowHeight;
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

  get visibleEras(): HistoryEra[] {
    const [visibleStart, visibleEnd] = this.dateExtent;
    const eras: HistoryEra[] = [
      {
        label: '5.3',
        start: this.datasetDateExtent[0],
        end: new Date('2026-04-21T12:00:00'),
        className: 'era-53'
      },
      {
        label: '5.5',
        start: new Date('2026-05-06T12:00:00'),
        end: new Date('2026-08-06T12:00:00'),
        className: 'era-55'
      },
      {
        label: '5.6',
        start: new Date('2026-08-06T12:00:00'),
        end: this.datasetDateExtent[1],
        className: 'era-56'
      }
    ];

    return eras.filter(era => era.start <= visibleEnd && era.end >= visibleStart);
  }

  eraStartX(era: HistoryEra): number {
    return Math.max(this.plotLeft, this.dayBoundaryX(era.start));
  }

  eraEndX(era: HistoryEra): number {
    return era.end >= this.datasetDateExtent[1]
      ? this.plotRight
      : Math.min(this.plotRight, this.dayBoundaryX(era.end));
  }

  get droughtStartX(): number {
    return Math.max(this.plotLeft, this.dayBoundaryX(this.droughtStart));
  }

  get droughtEndX(): number {
    return Math.min(this.plotRight, this.dayBoundaryX(this.droughtEnd));
  }

  get droughtY(): number {
    return this.topPadding;
  }

  get droughtHeight(): number {
    return this.axisY - this.topPadding;
  }

  get droughtLabelY(): number {
    return this.topPadding - 14;
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
    if (character && this.isCharacterSelected(character.id)) {
      this.removeCharacter(character.id);
      this.searchTerm = '';
      return;
    }

    if (
      !character ||
      this.historyCount(character.id) === 0 ||
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
      ...this.availableCharacters.map(character => this.createSeries(character))
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

  updateStartDate(value: string) {
    this.zoomLevel = 'custom';
    this.selectedStartDate = this.clampDateKey(
      value || this.datasetStartDate,
      this.datasetStartDate,
      this.selectedEndDate
    );
    this.invalidateDateRangeCaches();
  }

  updateEndDate(value: string) {
    this.zoomLevel = 'custom';
    this.selectedEndDate = this.clampDateKey(
      value || this.datasetEndDate,
      this.selectedStartDate,
      this.datasetEndDate
    );
    this.invalidateDateRangeCaches();
  }

  resetDateRange() {
    this.zoomLevel = 'full';
    this.selectedStartDate = this.datasetStartDate;
    this.selectedEndDate = this.datasetEndDate;
    this.invalidateDateRangeCaches();
  }

  setRecentDays(days: number) {
    this.zoomLevel = days as SlidingZoomLevel;
    const end = this.dateFromKey(this.datasetEndDate);
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);

    this.applyRecentDateRange(start);
  }

  isZoomLevel(days: number): boolean {
    return this.zoomLevel === days;
  }

  setCustomZoom() {
    this.zoomLevel = 'custom';
  }

  get hasSlidingZoom(): boolean {
    return typeof this.zoomLevel === 'number';
  }

  get zoomSliderMaximum(): number {
    const zoomDays = this.zoomLevel;
    if (typeof zoomDays !== 'number') return 0;
    const totalDays = this.calendarDayNumber(this.dateFromKey(this.datasetEndDate)) -
      this.calendarDayNumber(this.dateFromKey(this.datasetStartDate)) + 1;
    return Math.max(0, totalDays - zoomDays);
  }

  get zoomSliderValue(): number {
    return this.calendarDayNumber(this.dateFromKey(this.selectedStartDate)) -
      this.calendarDayNumber(this.dateFromKey(this.datasetStartDate));
  }

  get slidingZoomDays(): number {
    return typeof this.zoomLevel === 'number' ? this.zoomLevel : 0;
  }

  get canMoveZoomBackward(): boolean {
    return this.hasSlidingZoom && this.zoomSliderValue > 0;
  }

  get canMoveZoomForward(): boolean {
    return this.hasSlidingZoom && this.zoomSliderValue < this.zoomSliderMaximum;
  }

  get zoomLatestStartDate(): string {
    const start = this.dateFromKey(this.datasetStartDate);
    start.setDate(start.getDate() + this.zoomSliderMaximum);
    return this.toDateKey(start);
  }

  updateZoomStart(value: string) {
    const start = this.dateFromKey(this.datasetStartDate);
    start.setDate(start.getDate() + Number(value));
    this.updateSlidingZoomStart(this.toDateKey(start));
  }

  moveZoomWindow(direction: -1 | 1) {
    if (!this.hasSlidingZoom) return;
    this.moveZoomByDays(direction * this.slidingZoomDays);
  }

  private moveZoomByDays(days: number) {
    const nextOffset = Math.max(
      0,
      Math.min(this.zoomSliderMaximum, this.zoomSliderValue + days)
    );
    this.updateZoomStart(String(nextOffset));
  }

  @HostListener('document:keydown', ['$event'])
  handleZoomKeyboard(event: KeyboardEvent) {
    if (!this.hasSlidingZoom || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    const target = event.target as HTMLElement | null;
    const isSlider = target instanceof HTMLInputElement && target.type === 'range';
    if (!isSlider && (target?.matches('input, select, textarea') || target?.isContentEditable)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    this.moveZoomByDays(direction * (event.shiftKey ? this.slidingZoomDays : 1));
  }

  updateZoomStartDate(value: string) {
    if (!value) return;
    this.updateSlidingZoomStart(
      this.clampDateKey(value, this.datasetStartDate, this.zoomLatestStartDate)
    );
  }

  private updateSlidingZoomStart(startDateKey: string) {
    const zoomDays = this.zoomLevel;
    if (typeof zoomDays !== 'number') return;
    const start = this.dateFromKey(startDateKey);
    const end = new Date(start);
    end.setDate(end.getDate() + zoomDays - 1);
    this.selectedStartDate = this.toDateKey(start);
    this.selectedEndDate = this.clampDateKey(
      this.toDateKey(end),
      this.selectedStartDate,
      this.datasetEndDate
    );
    this.invalidateDateRangeCaches();
  }

  get dateFromSelectedStart(): Date {
    return this.dateFromKey(this.selectedStartDate);
  }

  get dateFromSelectedEnd(): Date {
    return this.dateFromKey(this.selectedEndDate);
  }

  private applyRecentDateRange(start: Date) {

    this.selectedStartDate = this.clampDateKey(
      this.toDateKey(start),
      this.datasetStartDate,
      this.datasetEndDate
    );
    this.selectedEndDate = this.datasetEndDate;
    this.invalidateDateRangeCaches();
  }

  isDateVisible(date: Date): boolean {
    const [start, end] = this.dateExtent;
    return date >= start && date <= end;
  }

  rowY(index: number): number {
    return this.topPadding + this.firstRowHeight / 2 + index * this.rowHeight;
  }

  dateX(date: Date): number {
    const [start, end] = this.dateExtent;
    const span = end.getTime() - start.getTime();
    const ratio = span === 0 ? 0.5 : (date.getTime() - start.getTime()) / span;
    return this.plotLeft + ratio * (this.plotRight - this.plotLeft);
  }

  private dayBoundaryX(date: Date): number {
    const [start, end] = this.dateExtent;
    const totalDays = this.calendarDayNumber(end) - this.calendarDayNumber(start) + 1;
    const dayOffset = this.calendarDayNumber(date) - this.calendarDayNumber(start);
    return this.plotLeft + (dayOffset / totalDays) * (this.plotRight - this.plotLeft);
  }

  pointColor(index: number): string {
    const colors = ['#2563eb', '#db2777', '#059669', '#d97706', '#7c3aed', '#0891b2', '#dc2626'];
    return colors[index % colors.length];
  }

  characterColor(characterId: number): string {
    if (this.characterColorCacheVersion !== this.seriesVersion) {
      this.characterColorCache.clear();
      this.series.forEach((item, index) => {
        this.characterColorCache.set(item.character.id, this.pointColor(index));
      });
      this.characterColorCacheVersion = this.seriesVersion;
    }
    return this.characterColorCache.get(characterId) ?? this.pointColor(0);
  }

  iconPath(character: Character): string {
    return character.img
      ? `assets/Icons/${character.img}`
      : 'assets/Icons/extended/Unknown.png';
  }

  useUnknownIcon(event: Event): void {
    const image = event.currentTarget as HTMLImageElement | SVGImageElement;
    if (image instanceof HTMLImageElement) {
      image.src = 'assets/Icons/extended/Unknown.png';
    } else {
      image.setAttribute('href', 'assets/Icons/extended/Unknown.png');
    }
  }

  histogramBarX(point: HistoryPoint): number {
    const [rangeStart, rangeEnd] = this.dateExtent;
    const { bucketDays, bucketCount } = this.histogramGeometry(rangeStart, rangeEnd);
    const dayOffset = this.calendarDayNumber(point.date) - this.calendarDayNumber(rangeStart);
    const bucketIndex = Math.floor(dayOffset / bucketDays);
    return this.plotLeft + (bucketIndex / bucketCount) * (this.plotRight - this.plotLeft);
  }

  histogramBarWidth(_point: HistoryPoint): number {
    const [rangeStart, rangeEnd] = this.dateExtent;
    return this.histogramGeometry(rangeStart, rangeEnd).barWidth;
  }

  histogramBarHeight(point: HistoryPoint): number {
    return Math.max(7, (point.count / this.visibleHistogramMaximum) * 34);
  }

  get visibleHistogramMaximum(): number {
    const cacheKey = this.displayStateKey;
    if (cacheKey === this.histogramMaximumCacheKey) return this.histogramMaximumCache;

    this.histogramMaximumCache = Math.max(
      1,
      ...this.displayedSeries.flatMap(item =>
        this.displayedPoints(item).map(point => point.count)
      )
    );
    this.histogramMaximumCacheKey = cacheKey;
    return this.histogramMaximumCache;
  }

  formatDate(date: Date): string {
    return this.dateFormatter.format(date);
  }

  private get dateExtent(): [Date, Date] {
    if (!this.selectedStartDate || !this.selectedEndDate) return this.datasetDateExtent;
    return [this.dateFromKey(this.selectedStartDate), this.dateFromKey(this.selectedEndDate)];
  }

  private calendarDayNumber(date: Date): number {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / (24 * 60 * 60 * 1000);
  }

  private histogramBucketDays(totalDays: number): number {
    return Math.max(1, Math.ceil(totalDays / 60));
  }

  private invalidateDateRangeCaches() {
    this.displayedPointsCache.clear();
    this.visibleCountCache.clear();
    this.histogramMaximumCacheKey = '';
    this.histogramGeometryCacheKey = '';
  }

  private histogramGeometry(rangeStart: Date, rangeEnd: Date) {
    const cacheKey = `${this.toDateKey(rangeStart)}|${this.toDateKey(rangeEnd)}`;
    if (cacheKey !== this.histogramGeometryCacheKey) {
      const totalDays = this.calendarDayNumber(rangeEnd) - this.calendarDayNumber(rangeStart) + 1;
      const bucketDays = this.histogramBucketDays(totalDays);
      const bucketCount = Math.ceil(totalDays / bucketDays);
      this.histogramGeometryCache = {
        bucketDays,
        bucketCount,
        barWidth: (this.plotRight - this.plotLeft) / bucketCount
      };
      this.histogramGeometryCacheKey = cacheKey;
    }
    return this.histogramGeometryCache;
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
