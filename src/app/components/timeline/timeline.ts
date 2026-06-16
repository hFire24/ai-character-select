import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character, CharacterService } from '../../services/character.service';
import { BackButton } from '../back-button/back-button';
import { CharacterModal } from '../character-modal/character-modal';

interface TimelineNode {
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

@Component({
  selector: 'app-timeline',
  imports: [CommonModule, BackButton, CharacterModal],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss'
})
export class Timeline implements OnInit, AfterViewInit {
  @ViewChild('timelineScroll') private timelineScroll?: ElementRef<HTMLElement>;

  nodes: TimelineNode[] = [];
  yearMarkers: { year: number; position: number }[] = [];
  selectedCharacter: Character | null = null;
  activeNodeKey: string | null = null;
  zoom = 5;
  timelineWidth = 900;
  totalCharacters = 0;
  startDate: Date | null = null;
  endDate: Date | null = null;

  private readonly baseWidth = 900;
  private readonly dayWidth = 2.8;
  readonly axisY = 96;
  private readonly genOneCutoff = new Date('2024-10-01T00:00:00');
  private readonly genFiveStart = new Date('2025-05-01T00:00:00');
  private readonly genFiveEnd = new Date('2025-06-30T23:59:59');

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    this.loadCharacters();
  }

  ngAfterViewInit() {
    this.scheduleScrollToRight();
  }

  loadCharacters() {
    this.characterService.getCharactersSplitTwins(false).subscribe(characters => {
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
        this.yearMarkers = [];
        return;
      }

      this.startDate = sortedGroups[0].date;
      this.endDate = sortedGroups[sortedGroups.length - 1].date;
      this.buildTimeline(sortedGroups);
      this.scheduleScrollToRight();
    });
  }

  onZoomChange(value: string) {
    const rightOffset = this.getRightScrollOffset();
    this.zoom = Number(value);
    this.recalculateTimeline();
    this.scheduleScrollToRightOffset(rightOffset);
  }

  openCharacter(character: Character) {
    this.selectedCharacter = character;
  }

  toggleNode(node: TimelineNode, event: MouseEvent) {
    event.stopPropagation();
    this.activeNodeKey = this.activeNodeKey === node.dateKey ? null : node.dateKey;
  }

  clearActiveNode() {
    this.activeNodeKey = null;
  }

  isNodeActive(node: TimelineNode): boolean {
    return this.activeNodeKey === node.dateKey;
  }

  closeCharacterModal() {
    this.selectedCharacter = null;
  }

  getTimelineHeight(): number {
    return 430;
  }

  private recalculateTimeline() {
    if (!this.nodes.length || !this.startDate || !this.endDate) return;

    const groups = this.nodes.map(node => ({
      date: node.date,
      dateKey: node.dateKey,
      characters: node.characters
    }));

    this.buildTimeline(groups);
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
      });
    });
  }

  private buildTimeline(groups: { date: Date; dateKey: string; characters: Character[] }[]) {
    const startDate = groups[0].date;
    const endDate = groups[groups.length - 1].date;
    const totalDays = Math.max(1, this.daysBetween(startDate, endDate));
    this.timelineWidth = Math.max(this.baseWidth, totalDays * this.dayWidth * this.zoom);

    this.nodes = groups.map(group => {
      const offsetDays = this.daysBetween(startDate, group.date);
      const position = 40 + ((offsetDays / totalDays) * (this.timelineWidth - 80));
      const generation = this.getNodeGeneration(group.date, group.characters);

      return {
        ...group,
        label: this.formatDate(group.date),
        generation,
        generationLabel: this.getGenerationLabel(generation),
        generationClass: this.getGenerationClass(generation),
        offsetDays,
        position,
        popupAlignment: this.getPopupAlignment(position)
      };
    });

    this.yearMarkers = this.buildYearMarkers(startDate, endDate, totalDays);
  }

  private buildYearMarkers(startDate: Date, endDate: Date, totalDays: number) {
    const markers: { year: number; position: number }[] = [];
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const markerDate = new Date(year, 0, 1);
      const clampedDate = markerDate < startDate ? startDate : markerDate;
      const offsetDays = this.daysBetween(startDate, clampedDate);
      markers.push({
        year,
        position: 40 + ((offsetDays / totalDays) * (this.timelineWidth - 80))
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
          .map(character => character.generation)
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
