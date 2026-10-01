import { groupDefinitionsWithoutGroupless } from './group-definitions';
import { createDynamicGroups, DynamicGroup } from './dynamic-groups';
import { CharacterIcon, CharacterIconViewport } from '../../directives/character-icon';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterModal } from '../character-modal/character-modal';
import { CharacterService, Character } from '../../services/character.service';
import { iconAssetPath, tallIconAssetPath } from '../../utils/character-assets';

interface Group {
  id: number | string;
  type: readonly string[];
  name: string;
  description?: string;
  characters: Character[];
}

interface GroupSearchSelection {
  kind: 'group' | 'character' | 'category' | 'dynamic';
  id: number | string;
  name: string;
  shortName?: string;
}

@Component({
  selector: 'app-groups',
  imports: [CharacterIcon, CommonModule, CharacterModal],
  templateUrl: './groups.html',
  styleUrls: ['./groups.scss']
})
export class Groups implements OnInit {
  groups: Group[] = [];
  dynamicGroups: DynamicGroup[] = [];
  characters: Character[] = [];
  loading = true;
  selectedCharacter: Character | null = null;
  searchTerm = '';
  searchSelections: GroupSearchSelection[] = [];
  readonly isMobile = inject(CharacterIconViewport).compact;
  private desktopCompactMode = false;

  get compactMode(): boolean {
    return this.isMobile() || this.desktopCompactMode;
  }

  set compactMode(value: boolean) {
    if (!this.isMobile()) this.desktopCompactMode = value;
  }
  private selectionOrder = new Map<string, number>();

  private readonly categoryLabels: Record<string, string> = {
    clothes: 'Attire & Equipment',
    interest: 'Interests',
    misc: 'Miscellaneous'
  };

  get categories(): GroupSearchSelection[] {
    return [...new Set([
      ...groupDefinitionsWithoutGroupless.flatMap(group => group.type),
      ...this.dynamicGroups.flatMap(group => group.type)
    ])]
      .map(type => ({
        kind: 'category',
        id: type,
        name: this.categoryLabels[type] ?? type.charAt(0).toUpperCase() + type.slice(1)
      }));
  }

  private matchesCategory(type: string | null, query: string): boolean {
    if (!type) return false;
    const names = [type, this.categoryLabels[type] ?? type];
    if (type === 'clothes') names.push('clothing', 'attire', 'equipment', 'accessories');
    return names.some(name => name.toLocaleLowerCase().includes(query));
  }

  get searchResults(): GroupSearchSelection[] {
    const query = this.searchTerm.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
    if (!query) return [];

    return [
      ...this.categories.filter(category => this.matchesCategory(String(category.id), query)),
      ...this.groups
        .filter(group => group.name.toLocaleLowerCase().includes(query) || group.type.some(type => this.matchesCategory(type, query)))
        .map(group => ({ kind: 'group' as const, id: group.id, name: group.name })),
      ...this.dynamicGroups
        .filter(group => {
          const dynamicQuery = query.replace(/\bevil\b/g, 'edgy').replace(/^all\s+/, '').replace(/\s+characters?$/, '');
          return group.name.toLocaleLowerCase().includes(dynamicQuery) || group.type.some(type => this.matchesCategory(type, query));
        })
        .map(group => ({ kind: 'dynamic' as const, id: group.id, name: group.name })),
      ...this.characters
        .filter(character => [character.name, character.shortName]
          .some(name => name.toLocaleLowerCase().includes(query)))
        .map(character => ({
          kind: 'character' as const,
          id: character.id,
          name: character.name,
          shortName: character.shortName
        }))
    ];
  }

  get visibleGroups(): Group[] {
    const groups = this.groups.filter(group => this.searchSelections.some(selection =>
      selection.kind === 'group'
        ? group.id === selection.id
        : selection.kind === 'category'
          ? group.type.includes(String(selection.id))
          : selection.kind === 'character' && group.characters.some(character => character.id === selection.id)));
    return [...groups, ...this.dynamicGroups.filter(group => this.searchSelections.some(selection =>
      (selection.kind === 'dynamic' && selection.id === group.id) ||
      (selection.kind === 'category' && group.type.includes(String(selection.id)))))];
  }

  addSearchSelection(selection: GroupSearchSelection) {
    if (!this.searchSelections.some(item => item.kind === selection.kind && item.id === selection.id)) {
      this.searchSelections = [...this.searchSelections, selection].sort((a, b) =>
        (this.selectionOrder.get(`${a.kind}:${a.id}`) ?? Infinity) -
        (this.selectionOrder.get(`${b.kind}:${b.id}`) ?? Infinity));
    }
    this.searchTerm = '';
  }

  replaceSearchSelection(selection: GroupSearchSelection) {
    this.searchSelections = [selection];
    this.searchTerm = '';
  }

  isSelected(selection: GroupSearchSelection): boolean {
    return this.searchSelections.some(item => item.kind === selection.kind && item.id === selection.id);
  }

  removeSearchSelection(selection: GroupSearchSelection) {
    this.searchSelections = this.searchSelections.filter(item =>
      item.kind !== selection.kind || item.id !== selection.id);
    this.searchTerm = '';
  }

  clearSearch() {
    this.searchSelections = [];
    this.searchTerm = '';
  }

  descriptionParts(description: string): string[] {
    return description.split(/(\p{Extended_Pictographic}\uFE0F?)/gu).filter(Boolean);
  }

  isEmoji(part: string): boolean {
    return /^\p{Extended_Pictographic}\uFE0F?$/u.test(part);
  }

  showAllCategories() {
    this.searchSelections = [];
    this.searchTerm = '';
    for (const category of this.categories) {
      this.addSearchSelection(category);
    }
  }

  constructor(
    private characterService: CharacterService
  ) {}

  ngOnInit() {
    this.characterService.getCharacters().subscribe(chars => {
      this.characters = chars;
      this.initializeGroups();
      this.dynamicGroups = createDynamicGroups(chars);
      this.loading = false;
    });
  }

  private initializeGroups() {

    this.selectionOrder.clear();
    groupDefinitionsWithoutGroupless.forEach((definition, index) => {
      const types = typeof definition.type === 'string' ? [definition.type] : definition.type;
      types.forEach(type => {
        if (!this.selectionOrder.has(`category:${type}`)) {
          this.selectionOrder.set(`category:${type}`, this.selectionOrder.size);
        }
      });
      this.selectionOrder.set(`group:${index + 1}`, this.selectionOrder.size);
      definition.characterIds.forEach(id => {
        if (!this.selectionOrder.has(`character:${id}`)) {
          this.selectionOrder.set(`character:${id}`, this.selectionOrder.size);
        }
      });
    });

    const groupDefinitions = [
      ...groupDefinitionsWithoutGroupless,
      {
        name: "Groupless Characters",
        type: ["meta"],
        description: "Characters not part of any other group, excluding dynamic groups",
        characterIds: this.getGrouplessCharacterIds(this.characters, groupDefinitionsWithoutGroupless)
      }
    ];

    this.groups = groupDefinitions.map((def, index) => {
      const chars = def.characterIds
        .map(id => this.characters.find(c => c.id === id))
        .filter((c): c is Character => c !== undefined);

      if (index === groupDefinitions.length - 1) {
        chars.sort((a, b) => a.id - b.id);
      }

      return {
        id: index + 1,
        type: typeof def.type === 'string' ? [def.type] : def.type,
        name: def.name,
        description: def.description,
        characters: chars
      };
    });
  }

  assetPath(path: string): string {
    return tallIconAssetPath(path);
  }

  fallbackAssetPath(path: string): string {
    return iconAssetPath(path);
  }

  private getGrouplessCharacterIds(characters: Character[], groupDefinitions: ReadonlyArray<{ readonly characterIds: readonly number[] }>): number[] {
    const groupedIds = new Set<number>(groupDefinitions.flatMap(def => def.characterIds));
    return characters
      .filter(character => !groupedIds.has(character.id))
      .map(character => character.id);
  }

  onCharacterClick(character: Character) {
    this.selectedCharacter = character; // Trigger modal display
  }
}
