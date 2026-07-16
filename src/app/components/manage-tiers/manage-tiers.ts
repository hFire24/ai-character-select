import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Character, CharacterService } from '../../services/character.service';
import { RelativeDatePipe } from "../../pipes/relative-date.pipe";
import { getStatusSortRank } from '../../utils/status-sort';

type ManagedCharacter = Character & {
  defaultTier: number;
  chatCount: number;
  weeklyChatCount: number;
  timestamp: Date | null;
};

type ManageTiersSortField = 'none' | 'tier' | 'name' | 'id' | 'status' | 'totalChats' | 'weeklyChats' | 'lastChat';
type SortDirection = 'asc' | 'desc';

type SortOption = {
  value: ManageTiersSortField;
  label: string;
};

type SortLevel = {
  level: 1 | 2 | 3;
  fieldLabel: string;
};

@Component({
  selector: 'app-manage-tiers',
  imports: [CommonModule, FormsModule, RelativeDatePipe],
  templateUrl: './manage-tiers.html',
  styleUrl: './manage-tiers.scss'
})
export class ManageTiers {
  characters: ManagedCharacter[] = [];
  searchTerm = '';
  statusFilter = 'all';
  tierFilter = 'all';
  sortBy: ManageTiersSortField = 'tier';
  sortDirection: SortDirection = 'asc';
  secondarySortBy: ManageTiersSortField = 'status';
  secondarySortDirection: SortDirection = 'asc';
  tertiarySortBy: ManageTiersSortField = 'id';
  tertiarySortDirection: SortDirection = 'asc';
  showSortOptions = false;
  sortOptions: SortOption[] = [
    { value: 'none', label: 'None' },
    { value: 'tier', label: 'Tier' },
    { value: 'name', label: 'Name' },
    { value: 'id', label: 'ID' },
    { value: 'status', label: 'Status' },
    { value: 'weeklyChats', label: 'Week' },
    { value: 'totalChats', label: 'Total' },
    { value: 'lastChat', label: 'Last' }
  ];
  sortLevels: SortLevel[] = [
    { level: 1, fieldLabel: 'First by' },
    { level: 2, fieldLabel: 'Then by' },
    { level: 3, fieldLabel: 'Then by' }
  ];
  isLoading = true;

  constructor(private characterService: CharacterService) {
    this.loadCharacters();
  }

  get statusOptions(): string[] {
    return Array.from(new Set(this.characters.map(character => character.status))).sort();
  }

  get tierOptions(): number[] {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
  }

  get filteredCharacters(): ManagedCharacter[] {
    const search = this.searchTerm.trim().toLowerCase();

    const filtered = this.characters.filter(character => {
      const matchesSearch = !search ||
        character.name.toLowerCase().includes(search) ||
        character.shortName.toLowerCase().includes(search) ||
        String(character.id).includes(search);
      const matchesStatus = this.statusFilter === 'all' || character.status === this.statusFilter;
      const matchesTier = this.tierFilter === 'all' || character.tier === Number(this.tierFilter);

      return matchesSearch && matchesStatus && matchesTier;
    });

    return this.sortCharacters(filtered);
  }

  get hasActiveFilters(): boolean {
    return this.searchTerm.trim().length > 0 ||
      this.statusFilter !== 'all' ||
      this.tierFilter !== 'all';
  }

  get activeFilterLabels(): string[] {
    const labels: string[] = [];
    const search = this.searchTerm.trim();

    if (search) labels.push(`Search: ${search}`);
    if (this.statusFilter !== 'all') labels.push(`Status: ${this.statusFilter}`);
    if (this.tierFilter !== 'all') labels.push(`Tier: ${this.tierFilter}`);

    return labels;
  }

  get sortSummaryLabels(): string[] {
    return this.getSortChain().map(sort => {
      const option = this.sortOptions.find(sortOption => sortOption.value === sort.field);
      return `${option?.label ?? sort.field} ${sort.direction === 'asc' ? 'Asc' : 'Desc'}`;
    });
  }

  getAllowedTiers(character: ManagedCharacter): number[] {
    return this.characterService.getAllowedTiersForStatus(character.status);
  }

  clearSort(): void {
    this.sortBy = 'tier';
    this.sortDirection = 'asc';
    this.secondarySortBy = 'status';
    this.secondarySortDirection = 'asc';
    this.tertiarySortBy = 'id';
    this.tertiarySortDirection = 'asc';
  }

  toggleSortOptions(): void {
    this.showSortOptions = !this.showSortOptions;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.tierFilter = 'all';
  }

  updateSortField(level: 1 | 2 | 3, field: string): void {
    const sortField = this.toSortField(field);

    if (level === 1) {
      this.sortBy = sortField;
    } else if (level === 2) {
      this.secondarySortBy = sortField;
    } else {
      this.tertiarySortBy = sortField;
    }
  }

  updateSortDirection(level: 1 | 2 | 3, direction: string): void {
    const sortDirection = direction === 'desc' ? 'desc' : 'asc';

    if (level === 1) {
      this.sortDirection = sortDirection;
    } else if (level === 2) {
      this.secondarySortDirection = sortDirection;
    } else {
      this.tertiarySortDirection = sortDirection;
    }
  }

  getSortField(level: 1 | 2 | 3): ManageTiersSortField {
    if (level === 1) return this.sortBy;
    if (level === 2) return this.secondarySortBy;
    return this.tertiarySortBy;
  }

  getSortDirection(level: 1 | 2 | 3): SortDirection {
    if (level === 1) return this.sortDirection;
    if (level === 2) return this.secondarySortDirection;
    return this.tertiarySortDirection;
  }

  updateTier(character: ManagedCharacter, tier: string | number): void {
    const newTier = Number(tier);
    if (!this.characterService.isTierValidForStatus(character.status, newTier)) return;

    character.tier = newTier;

    if (newTier === character.defaultTier) {
      this.characterService.clearTierOverride(character.id);
    } else {
      this.characterService.saveTierOverride(character.id, newTier);
    }
  }

  exportText(): void {
    const text = this.createTrimmedCharactersText(this.characters);
    this.downloadFile('characters.txt', text, 'text/plain');
  }

  exportTierMap(): void {
    const tierMap = Object.fromEntries(
      this.characters.map(character => [character.id, character.tier])
    );

    this.downloadFile(
      'character-tier-map.json',
      JSON.stringify(tierMap, null, 2),
      'application/json'
    );
  }

  importTierMap(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const tierMap = JSON.parse(await file.text()) as Record<string, unknown>;
        this.applyImportedTierMap(tierMap);
      } catch {
        alert('Import failed. Please choose a JSON file with ID and tier key-value pairs.');
      }
    };
    input.click();
  }

  private loadCharacters(): void {
    forkJoin({
      characters: this.characterService.getCharactersPlusCriticizer(),
      defaultCharacters: this.characterService.getDefaultCharactersPlusCriticizer()
    }).subscribe(({ characters, defaultCharacters }) => {
      const defaultTiers = new Map(defaultCharacters.map(character => [character.id, character.tier]));

      this.characters = characters
        .map(character => ({
          ...character,
          defaultTier: defaultTiers.get(character.id) ?? this.characterService.getDefaultTierForStatus(character.status),
          ...this.getChatCounts(character.id)
        }))
        .sort((a, b) => a.tier - b.tier || a.shortName.localeCompare(b.shortName));
      this.isLoading = false;
    });
  }

  private getChatCounts(characterId: number): {
    chatCount: number;
    weeklyChatCount: number;
    timestamp: Date | null;
  } {
    const timestampValue = localStorage.getItem('chatLinkTimestamp_' + characterId);
    const timestamp = timestampValue ? new Date(timestampValue) : null;
    const counter = localStorage.getItem('chatLinkCounter_' + characterId);
    const chatCount = counter ? parseInt(counter, 10) : 0;
    const historyStr = localStorage.getItem('chatLinkHistory_' + characterId);
    let weeklyChatCount = 0;

    if (historyStr) {
      try {
        const history: string[] = JSON.parse(historyStr);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        weeklyChatCount = history.filter(timestamp => {
          const date = new Date(timestamp);
          return date >= sevenDaysAgo;
        }).length;
      } catch (error) {
        console.error('Error parsing chat history:', error);
      }
    }

    return { chatCount, weeklyChatCount, timestamp };
  }

  private createTrimmedCharactersText(characters: ManagedCharacter[]): string {
    const fieldsToRemove = new Set([
      'img',
      'shortName',
      'id',
      'generation',
      'color',
      'musicEnjoyer',
      'personalityGirl',
      'status',
      'pronouns',
      'retirementDate',
      'moe',
      'futuristic',
      'emotion',
      'link',
      'inactiveReason',
      'retirementReason',
      'alternatives',
      'tier',
      'themeSong',
      'songLink',
      'defaultTier',
      'chatCount',
      'weeklyChatCount',
      'timestamp'
    ]);

    return [...characters]
      .sort((a, b) =>
        a.tier - b.tier ||
        this.compareCharacters(a, b, 'status') ||
        a.id - b.id
      )
      .map(character => {
        return Object.entries(character)
          .filter(([key, value]) => !fieldsToRemove.has(key) && value !== undefined && value !== null && value !== '')
          .map(([key, value]) => {
            const formattedKey = key.toLowerCase() === 'name' ? 'Name' : this.formatTextExportKey(key);
            return `${formattedKey}: ${value}`;
          })
          .join('\n');
      })
      .filter(characterText => characterText.length > 0)
      .join('\n\n');
  }

  private formatTextExportKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  }

  private sortCharacters(characters: ManagedCharacter[]): ManagedCharacter[] {
    const sortChain = this.getSortChain();
    if (sortChain.length === 0) return characters;

    return [...characters].sort((a, b) => {
      for (const sort of sortChain) {
        const comparison = this.compareCharacters(a, b, sort.field);
        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }

      return a.shortName.localeCompare(b.shortName);
    });
  }

  private getSortChain(): { field: ManageTiersSortField; direction: SortDirection }[] {
    const seenFields = new Set<ManageTiersSortField>();

    return [
      { field: this.sortBy, direction: this.sortDirection },
      { field: this.secondarySortBy, direction: this.secondarySortDirection },
      { field: this.tertiarySortBy, direction: this.tertiarySortDirection }
    ].filter(sort => {
      if (sort.field === 'none' || seenFields.has(sort.field)) return false;

      seenFields.add(sort.field);
      return true;
    });
  }

  private compareCharacters(
    a: ManagedCharacter,
    b: ManagedCharacter,
    field: ManageTiersSortField
  ): number {
    switch (field) {
      case 'tier':
        return a.tier - b.tier;
      case 'name':
        return a.shortName.localeCompare(b.shortName);
      case 'id':
        return a.id - b.id;
      case 'status':
        return getStatusSortRank(a.status) - getStatusSortRank(b.status) ||
          a.status.localeCompare(b.status);
      case 'totalChats':
        return a.chatCount - b.chatCount;
      case 'weeklyChats':
        return a.weeklyChatCount - b.weeklyChatCount;
      case 'lastChat':
        return (a.timestamp?.getTime() ?? 0) - (b.timestamp?.getTime() ?? 0);
      default:
        return 0;
    }
  }

  private toSortField(field: string): ManageTiersSortField {
    return this.sortOptions.some(option => option.value === field)
      ? field as ManageTiersSortField
      : 'none';
  }

  private applyImportedTierMap(tierMap: Record<string, unknown>): void {
    const adjustedCharacters: string[] = [];

    this.characters = this.characters.map(character => {
      if (!(String(character.id) in tierMap)) return character;

      const importedTier = Number(tierMap[String(character.id)]);
      const isValid = Number.isInteger(importedTier) &&
        this.characterService.isTierValidForStatus(character.status, importedTier);
      const tier = isValid ? importedTier : character.defaultTier;

      if (isValid && tier !== character.defaultTier) {
        this.characterService.saveTierOverride(character.id, tier);
      } else {
        this.characterService.clearTierOverride(character.id);
      }

      if (!isValid) {
        adjustedCharacters.push(`${character.shortName} (${character.id}) -> tier ${character.defaultTier}`);
      }

      return { ...character, tier };
    });

    if (adjustedCharacters.length > 0) {
      alert(
        'Some imported tiers were invalid and were automatically set to their defaults:\n\n' +
        adjustedCharacters.join('\n')
      );
    } else {
      alert('Tier map imported successfully.');
    }
  }

  private downloadFile(filename: string, content: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
