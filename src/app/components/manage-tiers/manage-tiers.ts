import { Component, ElementRef, HostListener, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Character, CharacterService } from '../../services/character.service';
import { RelativeDatePipe } from "../../pipes/relative-date.pipe";
import { getStatusSortRank } from '../../utils/status-sort';
import { CharacterModal } from '../character-modal/character-modal';

type ManagedCharacter = Character & {
  defaultTier: number;
  chatCount: number;
  weeklyChatCount: number;
  timestamp: Date | null;
};

type ManageTiersSortField = 'tier' | 'name' | 'id' | 'status' | 'totalChats' | 'weeklyChats' | 'lastChat';
type SortDirection = 'asc' | 'desc';

type SortOption = {
  value: ManageTiersSortField;
  label: string;
};

type SortRule = {
  field: ManageTiersSortField;
  direction: SortDirection;
};

@Component({
  selector: 'app-manage-tiers',
  imports: [CommonModule, FormsModule, RelativeDatePipe, CharacterModal],
  templateUrl: './manage-tiers.html',
  styleUrl: './manage-tiers.scss'
})
export class ManageTiers {
  @ViewChildren('filterDropdown') private filterDropdowns!: QueryList<ElementRef<HTMLDetailsElement>>;

  @HostListener('document:click', ['$event'])
  closeFiltersOnOutsideClick(event: MouseEvent): void {
    this.filterDropdowns.forEach(({ nativeElement: dropdown }) => {
      if (!dropdown.contains(event.target as Node)) dropdown.open = false;
    });
  }

  characters: ManagedCharacter[] = [];
  selectedCharacter: Character | null = null;
  searchTerm = '';
  selectedStatuses: string[] = [];
  selectedTiers: number[] = [];
  showSortOptions = false;
  readonly sortPresets = [
    {
      value: 'default',
      label: 'Sort Preset 1',
      sorts: [
        { field: 'tier', direction: 'asc' },
        { field: 'status', direction: 'asc' },
        { field: 'id', direction: 'asc' }
      ]
    },
    {
      value: 'activity',
      label: 'Sort Preset 2',
      sorts: [
        { field: 'weeklyChats', direction: 'desc' },
        { field: 'lastChat', direction: 'desc' },
        { field: 'tier', direction: 'asc' },
        { field: 'status', direction: 'asc' },
        { field: 'id', direction: 'asc' }
      ]
    }
  ] as const;
  sortOptions: SortOption[] = [
    { value: 'tier', label: 'Tier' },
    { value: 'name', label: 'Name' },
    { value: 'id', label: 'ID' },
    { value: 'status', label: 'Status' },
    { value: 'weeklyChats', label: 'Week' },
    { value: 'totalChats', label: 'Total' },
    { value: 'lastChat', label: 'Last' }
  ];
  sorts: SortRule[] = this.sortPresets[0].sorts.map(sort => ({ ...sort }));
  isLoading = true;

  constructor(private characterService: CharacterService) {
    this.loadCharacters();
  }

  readonly statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'side', label: 'Side' },
    { value: 'inactive side', label: 'Inactive Side' },
    { value: 'retired', label: 'Retired' },
    { value: 'retired side', label: 'Retired Side' },
    { value: 'other', label: 'Other' }
  ];

  get tierOptions(): number[] {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }

  get filteredCharacters(): ManagedCharacter[] {
    const search = this.searchTerm.trim().toLowerCase();

    const filtered = this.characters.filter(character => {
      const matchesSearch = !search ||
        character.name.toLowerCase().includes(search) ||
        character.shortName.toLowerCase().includes(search) ||
        String(character.id).includes(search);
      const status = ['future', 'me'].includes(character.status) ? 'other' : character.status;
      const matchesStatus = !this.selectedStatuses.length || this.selectedStatuses.includes(status);
      const matchesTier = !this.selectedTiers.length || this.selectedTiers.includes(character.tier);

      return matchesSearch && matchesStatus && matchesTier;
    });

    return this.sortCharacters(filtered);
  }

  get hasActiveFilters(): boolean {
    return this.searchTerm.trim().length > 0 ||
      this.selectedStatuses.length > 0 ||
      this.selectedTiers.length > 0;
  }

  get activeFilterLabels(): string[] {
    const labels: string[] = [];
    const search = this.searchTerm.trim();

    if (search) labels.push(`Search: ${search}`);
    if (this.selectedStatuses.length > 0) {
      const statuses = this.statusOptions.filter(option => this.selectedStatuses.includes(option.value));
      labels.push(`Status: ${statuses.map(option => option.label).join(', ')}`);
    }
    if (this.selectedTiers.length > 0) labels.push(`Tier: ${this.selectedTiers.join(', ')}`);

    return labels;
  }

  get sortSummaryLabels(): string[] {
    return this.sorts.map(sort => {
      const option = this.sortOptions.find(sortOption => sortOption.value === sort.field);
      return `${option?.label ?? sort.field} ${sort.direction === 'asc' ? 'Asc' : 'Desc'}`;
    });
  }

  getAllowedTiers(character: ManagedCharacter): number[] {
    return this.characterService.getAllowedTiersForStatus(character.status);
  }

  clearSort(): void {
    this.applySortPreset('default');
  }

  get activeSortPreset(): string | undefined {
    return this.sortPresets.find(preset =>
      preset.sorts.length === this.sorts.length && preset.sorts.every((sort, index) =>
        this.sorts[index].field === sort.field && this.sorts[index].direction === sort.direction
      )
    )?.value;
  }

  applySortPreset(value: 'default' | 'activity'): void {
    const preset = this.sortPresets.find(preset => preset.value === value)!;
    this.sorts = preset.sorts.map(sort => ({ ...sort }));
  }

  toggleSortOptions(): void {
    this.showSortOptions = !this.showSortOptions;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatuses = [];
    this.selectedTiers = [];
  }

  toggleStatusFilter(status: string): void {
    this.selectedStatuses = this.selectedStatuses.includes(status)
      ? this.selectedStatuses.filter(value => value !== status)
      : [...this.selectedStatuses, status];
  }

  toggleTierFilter(tier: number): void {
    this.selectedTiers = this.selectedTiers.includes(tier)
      ? this.selectedTiers.filter(value => value !== tier)
      : [...this.selectedTiers, tier];
  }

  availableSortOptions(index: number): SortOption[] {
    return this.sortOptions.filter(option =>
      !this.sorts.some((sort, sortIndex) => sortIndex !== index && sort.field === option.value)
    );
  }

  addSort(): void {
    const option = this.availableSortOptions(-1)[0];
    if (option) this.sorts.push({ field: option.value, direction: 'asc' });
  }

  removeSort(index: number): void {
    if (index >= 0 && index < this.sorts.length) this.sorts.splice(index, 1);
  }

  moveSort(index: number, offset: -1 | 1): void {
    const target = index + offset;
    if (index < 0 || index >= this.sorts.length || target < 0 || target >= this.sorts.length) return;
    [this.sorts[index], this.sorts[target]] = [this.sorts[target], this.sorts[index]];
  }

  updateSortField(index: number, field: string): void {
    const option = this.availableSortOptions(index).find(option => option.value === field);
    if (this.sorts[index] && option) this.sorts[index].field = option.value;
  }

  updateSortDirection(index: number, direction: string): void {
    if (this.sorts[index]) this.sorts[index].direction = direction === 'desc' ? 'desc' : 'asc';
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
      characters: this.characterService.getCharacters(),
      defaultCharacters: this.characterService.getDefaultCharacters()
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
    const fieldsToInclude = [
      'name',
      'creationDate',
      'birthday',
      'summary',
      'interests',
      'peeves',
      'purpose',
      'funFact',
      'description',
      'note'
    ] as const;

    return [...characters]
      .sort((a, b) =>
        a.tier - b.tier ||
        this.compareCharacters(a, b, 'status') ||
        a.id - b.id
      )
      .map(character => {
        return fieldsToInclude
          .map(key => [key, character[key]] as const)
          .filter(([, value]) => value !== undefined && value !== null && value !== '')
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
    const sortChain = this.sorts;
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
