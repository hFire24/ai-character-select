import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character, CharacterService } from '../../services/character.service';
import { CharacterModal } from '../character-modal/character-modal';

interface TimelineNode {
  collapsed?: boolean;
  nodeCount?: number;
  colorClasses?: string[];
  layoutWidth?: number;
  overviewPosition: number;
  date: Date;
  dateKey: string;
  label: string;
  characters: Character[];
  generation: number | 'mixed' | 'unknown';
  generationLabel: string;
  generationClass: string;
  offsetDays: number;
  position: number;
  popupAlignment: 'left' | 'center' | 'right';
}

interface GenerationSection {
  label: string;
  generationClass: string;
  start: number;
  end: number;
  dateRange: string;
}

@Component({
  selector: 'app-timeline',
  imports: [CommonModule, CharacterModal],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss'
})
export class Timeline implements OnInit, AfterViewInit, OnDestroy {
  private timelineScroll?: ElementRef<HTMLElement>;
  private resizeObserver?: ResizeObserver;
  @ViewChild('timelineScroll') set scrollContainer(element: ElementRef<HTMLElement> | undefined) {
    this.resizeObserver?.disconnect();
    this.timelineScroll = element;
    if (element && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.zone.run(() => this.updateScrollOverflow()));
      this.resizeObserver.observe(element.nativeElement);
      const canvas = element.nativeElement.firstElementChild;
      if (canvas) this.resizeObserver.observe(canvas);
    }
    if (!element) this.hasScrollOverflow = false;
  }

  nodes: TimelineNode[] = [];
  equalNodes: TimelineNode[] = [];
  hoveredNode: TimelineNode | null = null;
  focusedNode: TimelineNode | null = null;
  hoveredGenerationKey: string | null = null;
  focusedGenerationKey: string | null = null;
  overviewCharacters: { position: number; generationClass: string; generation: TimelineNode['generation']; label: string }[] = [];
  yearMarkers: { year: number; position: number }[] = [];
  monthMarkers: { label: string; fullLabel: string; position: number }[] = [];
  selectedCharacter: Character | null = null;
  searchQuery = '';
  searchResults: Character[] = [];
  activeNodeKey: string | null = null;
  timelineScrollLeft = 0;
  collapsedGenerations = new Set<string>();
  generationGroups: { key: string; label: string; count: number; nodeCount: number; colorClasses: string[]; dateRange: string; start: number; end: number; sections: GenerationSection[] }[] = [];
  timelineWidth = 900;
  hasScrollOverflow = false;
  expandedGenerationControls: { key: string; label: string; nodeCount: number; position: number; top: number; width: number; colorClasses: string[] }[] = [];
  totalCharacters = 0;
  startDate: Date | null = null;
  endDate: Date | null = null;

  private readonly baseWidth = 900;
  private scrollAnimation: number | null = null;
  readonly axisY = 70;
  private readonly genOneCutoff = new Date('2024-10-01T00:00:00');
  private readonly genFiveStart = new Date('2025-05-01T00:00:00');
  private readonly genFiveEnd = new Date('2025-06-30T23:59:59');

  constructor(private characterService: CharacterService, private zone: NgZone) {}

  ngOnInit() {
    this.loadCharacters();
  }

  ngAfterViewInit() {
    this.scheduleScrollToRight();
  }

  ngOnDestroy() {
    this.stopArrowScroll();
    this.resizeObserver?.disconnect();
  }

  updateScrollOverflow() {
    const element = this.timelineScroll?.nativeElement;
    this.hasScrollOverflow = !!element && element.scrollWidth > element.clientWidth;
    if (!this.hasScrollOverflow) this.stopArrowScroll();
  }

  startArrowScroll(direction: -1 | 1) {
    this.stopArrowScroll();
    const scroll = () => {
      const element = this.timelineScroll?.nativeElement;
      if (!element) {
        this.scrollAnimation = null;
        return;
      }
      const previous = element.scrollLeft;
      element.scrollLeft += direction * 3;
      if (element.scrollLeft === previous) {
        this.scrollAnimation = null;
        return;
      }
      this.scrollAnimation = requestAnimationFrame(scroll);
    };
    this.scrollAnimation = requestAnimationFrame(scroll);
  }

  stopArrowScroll() {
    if (this.scrollAnimation !== null) cancelAnimationFrame(this.scrollAnimation);
    this.scrollAnimation = null;
  }

  scrollByArrow(direction: -1 | 1) {
    const element = this.timelineScroll?.nativeElement;
    if (element) element.scrollLeft += direction * element.clientWidth * 0.7;
  }

  updateSearch(query: string) {
    this.searchQuery = query;
    const term = query.trim().toLowerCase();
    this.searchResults = term ? this.nodes.flatMap(node => node.characters)
      .filter(character => (character.name || '').toLowerCase().includes(term)
        || (character.shortName || '').toLowerCase().includes(term)) : [];
  }

  selectSearchResult(character: Character) {
    const node = this.nodes.find(item => item.characters.some(candidate => candidate.id === character.id));
    if (!node) return;
    const key = this.generationKey(node);
    if (this.collapsedGenerations.delete(key)) this.layoutGenerations();
    this.hoveredNode = null;
    this.focusedNode = null;
    this.hoveredGenerationKey = null;
    this.focusedGenerationKey = null;
    this.activeNodeKey = node.dateKey;
    this.searchQuery = '';
    this.searchResults = [];
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const element = this.timelineScroll?.nativeElement;
      const target = this.equalNodes.find(item => item.dateKey === node.dateKey && !item.collapsed);
      if (element && target) element.scrollLeft = Math.max(0, target.position - element.clientWidth / 2);
    }));
  }

  loadCharacters() {
    this.characterService.getCharactersSplitTwins().subscribe(characters => {
      const datedCharacters = characters.filter(character => this.parseDate(character.creationDate));
      this.totalCharacters = datedCharacters.length;

      const groupedByDate = datedCharacters.reduce((groups, character) => {
        const dateKey = character.creationDate!;
        groups.set(dateKey, [...(groups.get(dateKey) ?? []), character]);
        return groups;
      }, new Map<string, Character[]>());

      const sortedGroups = Array.from(groupedByDate.entries())
        .map(([dateKey, groupCharacters]) => ({
          date: this.parseDate(dateKey)!,
          dateKey,
          characters: groupCharacters.sort((a, b) => a.id - b.id)
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (!sortedGroups.length) {
        this.nodes = [];
        this.equalNodes = [];
        this.generationGroups = [];
        this.expandedGenerationControls = [];
        this.overviewCharacters = [];
        this.hoveredGenerationKey = null;
        this.focusedGenerationKey = null;
        this.activeNodeKey = null;
        this.hoveredNode = null;
        this.focusedNode = null;
        this.yearMarkers = [];
        this.monthMarkers = [];
        return;
      }

      this.startDate = sortedGroups[0].date;
      this.endDate = sortedGroups[sortedGroups.length - 1].date;
      this.buildTimeline(sortedGroups);
      this.scheduleScrollToRight();
    });
  }

  toggleGeneration(key: string) {
    const rightOffset = this.getRightScrollOffset();
    if (this.collapsedGenerations.has(key)) this.collapsedGenerations.delete(key);
    else this.collapsedGenerations.add(key);
    this.layoutGenerations();
    this.scheduleScrollToRightOffset(rightOffset);
  }

  collapseAllGenerations() {
    const rightOffset = this.getRightScrollOffset();
    this.collapsedGenerations = new Set(this.generationGroups.map(group => group.key));
    this.layoutGenerations();
    this.scheduleScrollToRightOffset(rightOffset);
  }

  trackGeneration(_index: number, group: { key: string }): string {
    return group.key;
  }

  generationBackground(classes: string[]): string {
    const palette: Record<string, string> = {
      gen1: '#d94f70', gen2: '#4caf50', gen3: '#ff9800', gen4: '#9c27b0',
      gen5: '#2196f3', gen6: '#f44336', gen7: '#9c27b0', gen8: '#ff5722',
      gen9: '#673ab7', gen10: '#fbc02d', gen11: '#9c27b0', gen12: '#009688', gen13: '#e91e63', gen14: '#3f51b5'
    };
    const colors = classes.length ? classes.map(color => palette[color] ?? '#7d8794') : ['#7d8794'];
    const stops = colors.flatMap((color, index) => [
      `${color} ${index / colors.length * 100}%`, `${color} ${(index + 1) / colors.length * 100}%`
    ]);
    return `linear-gradient(var(--generation-tint-overlay, #ffffffcc), var(--generation-tint-overlay, #ffffffcc)), linear-gradient(90deg, ${stops.join(', ')})`;
  }

  openCharacter(character: Character) {
    this.selectedCharacter = character;
  }

  toggleNode(node: TimelineNode, event: MouseEvent) {
    event.stopPropagation();
    if (node.collapsed) {
      this.toggleGeneration(this.generationKey(node));
      return;
    }
    this.activeNodeKey = this.activeNodeKey === node.dateKey ? null : node.dateKey;
  }

  clearActiveNode() {
    this.activeNodeKey = null;
  }

  isNodeActive(node: TimelineNode): boolean {
    return this.activeNodeKey === node.dateKey;
  }

  get highlightedNode(): TimelineNode | null {
    const node = this.hoveredNode ?? this.focusedNode
      ?? this.equalNodes.find(node => this.isNodeActive(node)) ?? null;
    return node?.collapsed || this.highlightedGeneration ? null : node;
  }

  get highlightedGeneration() {
    const node = this.hoveredNode ?? this.focusedNode;
    const key = this.hoveredGenerationKey ?? (node?.collapsed ? this.generationKey(node) : null)
      ?? (this.hoveredNode ? null : this.focusedGenerationKey);
    return this.generationGroups.find(group => group.key === key) ?? null;
  }

  closeCharacterModal() {
    this.selectedCharacter = null;
  }

  getTimelineHeight(): number {
    return Math.max(150, ...this.expandedGenerationControls.map(control => control.top + 42));
  }

  updateTimelineScroll() {
    this.timelineScrollLeft = this.timelineScroll?.nativeElement.scrollLeft ?? 0;
  }

  tooltipLeft(node: TimelineNode): number {
    const width = this.timelineScroll?.nativeElement.clientWidth ?? 0;
    return Math.max(0, Math.min(node.position - this.timelineScrollLeft - 127, width - 254));
  }

  leaveNode(event: MouseEvent) {
    const next = event.relatedTarget as HTMLElement | null;
    if (!next?.closest('.node-tooltip')) this.hoveredNode = null;
  }

  private getRightScrollOffset(): number {
    const scrollElement = this.timelineScroll?.nativeElement;
    if (!scrollElement) return 0;

    return Math.max(
      0,
      scrollElement.scrollWidth - scrollElement.clientWidth - scrollElement.scrollLeft
    );
  }

  private scheduleScrollToRight() {
    this.scheduleScrollToRightOffset(0);
  }

  private scheduleScrollToRightOffset(rightOffset: number) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const scrollElement = this.timelineScroll?.nativeElement;
        if (!scrollElement) return;

        const maxScrollLeft = Math.max(0, scrollElement.scrollWidth - scrollElement.clientWidth);
        scrollElement.scrollLeft = Math.max(0, maxScrollLeft - rightOffset);
        this.updateTimelineScroll();
        this.updateScrollOverflow();
      });
    });
  }

  private buildTimeline(groups: { date: Date; dateKey: string; characters: Character[] }[]) {
    const startDate = groups[0].date;
    const endDate = groups[groups.length - 1].date;
    const totalDays = this.daysBetween(startDate, endDate);
    this.timelineWidth = this.baseWidth;
    const positionForDate = (date: Date): number => {
      if (!totalDays) return 40;
      return 40 + this.daysBetween(startDate, date) / totalDays * (this.timelineWidth - 80);
    };

    this.nodes = groups.map(group => {
      const offsetDays = this.daysBetween(startDate, group.date);
      const position = positionForDate(group.date);
      const generation = this.getNodeGeneration(group.date, group.characters);

      return {
        ...group,
        label: this.formatDate(group.date),
        generation,
        generationLabel: this.getGenerationLabel(generation),
        generationClass: this.getGenerationClass(generation),
        offsetDays,
        position,
        overviewPosition: (position - 40) / (this.timelineWidth - 80) * 100,
        popupAlignment: this.getPopupAlignment(position)
      };
    });

    this.overviewCharacters = this.nodes.flatMap(node => node.characters.map(character => {
      const generation = this.getNodeGeneration(node.date, [character]);
      return { position: node.overviewPosition, generation,
        generationClass: this.getGenerationClass(generation), label: node.label };
    }));

    this.yearMarkers = this.buildYearMarkers(startDate, endDate, positionForDate);
    this.monthMarkers = this.buildMonthMarkers(startDate, endDate, positionForDate)
      .reduce<typeof this.monthMarkers>((markers, marker) => {
        if (!markers.length || marker.position - markers[markers.length - 1].position >= 36) {
          markers.push(marker);
        }
        return markers;
      }, []);

    // Normalize the date scale to the width of the overview.
    this.yearMarkers = this.yearMarkers.map(marker => ({
      ...marker, position: (marker.position - 40) / (this.timelineWidth - 80) * 100
    }));
    this.collapsedGenerations = new Set(this.nodes.map(node => this.generationKey(node)));
    this.layoutGenerations();
  }

  private generationKey(node: TimelineNode): string {
    if (node.generation === 13 || node.generation === 14) return '13-14';
    if (node.generation === 5 || node.generation === 6) return '5-6';
    return typeof node.generation === 'number' && node.generation >= 2 && node.generation <= 4
      ? '2-4' : String(node.generation);
  }

  private groupLabel(key: string, node: TimelineNode): string {
    if (key === '13-14') return 'Gens 13–14';
    return key === '2-4' ? 'Gens 2–4' : key === '5-6' ? 'Gens 5–6' : node.generationLabel;
  }

  private layoutGenerations() {
    const groups = new Map<string, TimelineNode[]>();
    this.nodes.forEach(node => {
      const key = this.generationKey(node);
      groups.set(key, [...(groups.get(key) ?? []), node]);
    });
    this.generationGroups = [...groups].map(([key, nodes]) => ({
      key,
      label: this.groupLabel(key, nodes[0]),
      dateRange: nodes[0].label === nodes[nodes.length - 1].label ? nodes[0].label : `${nodes[0].label} – ${nodes[nodes.length - 1].label}`,
      start: nodes[0].overviewPosition,
      end: nodes[nodes.length - 1].overviewPosition,
      count: nodes.reduce((sum, node) => sum + node.characters.length, 0),
      nodeCount: nodes.length,
      colorClasses: [...new Set(nodes.map(node => node.generationClass))],
      sections: [...new Set(nodes.flatMap(node => node.characters.map(character => this.getNodeGeneration(node.date, [character]))))]
        .map(generation => {
          const markers = nodes.flatMap(node => node.characters
            .filter(character => this.getNodeGeneration(node.date, [character]) === generation)
            .map(() => node));
          const first = markers[0];
          const last = markers[markers.length - 1];
          return { label: this.getGenerationLabel(generation), generationClass: this.getGenerationClass(generation),
            start: first.overviewPosition, end: last.overviewPosition,
            dateRange: first.label === last.label ? first.label : `${first.label} – ${last.label}` };
        })
    }));
    const seen = new Set<string>();
    const visible: TimelineNode[] = [];
    this.nodes.forEach(node => {
      const key = this.generationKey(node);
      if (!this.collapsedGenerations.has(key)) {
        visible.push(node);
      } else if (!seen.has(key)) {
        seen.add(key);
        const members = groups.get(key)!;
        const last = members[members.length - 1];
        visible.push({
          ...node,
          collapsed: true,
          nodeCount: members.length,
          dateKey: `generation:${key}`,
          label: node.label === last.label ? node.label : `${node.label} – ${last.label}`,
          generationLabel: this.groupLabel(key, node),
          characters: members.flatMap(member => member.characters),
          overviewPosition: (node.overviewPosition + last.overviewPosition) / 2,
          colorClasses: [...new Set(members.map(member => member.generationClass))]
        });
      }
    });
    // Use the same 12px visual gap everywhere, allowing for wider generation buttons.
    const widths = visible.map(node => node.collapsed
      ? Math.max(72, node.generationLabel.length * 7 + 12) : 12);
    let nextLeft = 40;
    const positions = visible.map((_node, index) => {
      const position = nextLeft + widths[index] / 2;
      nextLeft += widths[index] + 12;
      return position;
    });
    this.timelineWidth = nextLeft + 28;
    this.equalNodes = visible.map((node, index) => {
      const position = positions[index];
      return {
        ...node,
        layoutWidth: widths[index],
        position,
        popupAlignment: this.getPopupAlignment(position)
      };
    });
    const rowEnds: number[] = [];
    this.expandedGenerationControls = this.generationGroups
      .filter(group => !this.collapsedGenerations.has(group.key))
      .map(group => {
        const members = this.equalNodes.filter(node => this.generationKey(node) === group.key);
        const width = 80;
        const position = Math.max(width / 2 + 8, (members[0].position + members[members.length - 1].position) / 2);
        let row = rowEnds.findIndex(end => end + 8 <= position - width / 2);
        if (row < 0) row = rowEnds.length;
        rowEnds[row] = position + width / 2;
        return { key: group.key, label: group.label, nodeCount: group.nodeCount, colorClasses: group.colorClasses,
          position, width, top: 94 + row * 44 };
      });
    this.timelineWidth = Math.max(this.timelineWidth, ...rowEnds.map(end => end + 8));
    // Removed controls do not reliably emit mouseleave/blur when collapsed.
    this.hoveredGenerationKey = null;
    this.focusedGenerationKey = null;
    this.hoveredNode = null;
    this.focusedNode = null;
    this.activeNodeKey = null;
  }

  private buildMonthMarkers(startDate: Date, endDate: Date, positionForDate: (date: Date) => number) {
    const markers: { label: string; fullLabel: string; position: number }[] = [];
    const month = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (month <= endDate) {
      const markerDate = month < startDate ? startDate : month;
      markers.push({
        label: month.toLocaleDateString(undefined, { month: 'short' }),
        fullLabel: month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        position: positionForDate(markerDate)
      });
      month.setMonth(month.getMonth() + 1);
    }

    return markers;
  }

  private buildYearMarkers(startDate: Date, endDate: Date, positionForDate: (date: Date) => number) {
    const markers: { year: number; position: number }[] = [];
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const markerDate = new Date(year, 0, 1);
      const clampedDate = markerDate < startDate ? startDate : markerDate;
      markers.push({
        year,
        position: positionForDate(clampedDate)
      });
    }

    return markers;
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private daysBetween(start: Date, end: Date): number {
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  private getPopupAlignment(position: number): 'left' | 'center' | 'right' {
    if (position < 140) return 'left';
    if (this.timelineWidth - position < 140) return 'right';
    return 'center';
  }

  private getNodeGeneration(date: Date, characters: Character[]): number | 'mixed' | 'unknown' {
    if (date < this.genOneCutoff) return 1;
    if (date >= this.genFiveStart && date <= this.genFiveEnd) return 5;

    const generations = Array.from(
      new Set(
        characters
          // Timeline-only overrides; keep the stored character generations unchanged.
          .map(character => character.id === 59 || character.id === 60 ? 7 : character.generation)
          .filter((generation): generation is number => Number.isInteger(generation))
      )
    );

    if (generations.length === 0) return 'unknown';
    if (generations.length > 1) return 'mixed';
    return generations[0];
  }

  private getGenerationLabel(generation: number | 'mixed' | 'unknown'): string {
    if (typeof generation === 'number') return `Gen ${generation}`;
    return generation === 'mixed' ? 'Mixed generations' : 'Unknown generation';
  }

  private getGenerationClass(generation: number | 'mixed' | 'unknown'): string {
    if (typeof generation === 'number') return `gen${generation}`;
    return generation;
  }
}
