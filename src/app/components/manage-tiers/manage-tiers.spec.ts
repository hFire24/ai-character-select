import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ManageTiers } from './manage-tiers';
import { CharacterService } from '../../services/character.service';

describe('ManageTiers', () => {
  let component: ManageTiers;
  let fixture: ComponentFixture<ManageTiers>;
  const characterServiceSpy = jasmine.createSpyObj<CharacterService>(
    'CharacterService',
    [
      'getCharacters',
      'getDefaultCharacters',
      'getAllowedTiersForStatus',
      'getDefaultTierForStatus',
      'isTierValidForStatus',
      'saveTierOverride',
      'clearTierOverride'
    ]
  );

  beforeEach(async () => {
    characterServiceSpy.getCharacters.and.returnValue(of([]));
    characterServiceSpy.getDefaultCharacters.and.returnValue(of([]));
    characterServiceSpy.getAllowedTiersForStatus.and.returnValue([1, 2, 3, 4]);
    characterServiceSpy.getDefaultTierForStatus.and.returnValue(4);
    characterServiceSpy.isTierValidForStatus.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [ManageTiers],
      providers: [
        { provide: CharacterService, useValue: characterServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageTiers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sorts by week descending, last descending, then tier with the activity preset', () => {
    const character = (id: number, weeklyChatCount: number, timestamp: Date | null, tier: number) => ({
      id, name: `Character ${id}`, shortName: `Character ${id}`, status: 'active',
      tier, defaultTier: tier, weeklyChatCount, timestamp, chatCount: weeklyChatCount
    } as typeof component.characters[number]);
    const recent = new Date('2026-01-02');
    const older = new Date('2026-01-01');
    component.characters = [
      character(1, 1, recent, 1),
      character(2, 3, older, 1),
      character(3, 3, recent, 3),
      character(4, 3, recent, 1),
      character(5, 3, null, 1)
    ];

    component.applySortPreset('activity');

    expect(component.activeSortPreset).toBe('activity');
    expect(component.sortSummaryLabels).toEqual(['Week Desc', 'Last Desc', 'Tier Asc', 'Status Asc', 'ID Asc']);
    expect(component.filteredCharacters.map(character => character.id)).toEqual([4, 3, 2, 5, 1]);
    component.updateSortDirection(0, 'asc');
    expect(component.activeSortPreset).toBeUndefined();
  });

  it('starts with the default preset and restores tier, status, and ID ordering on reset', () => {
    expect(component.activeSortPreset).toBe('default');
    component.characters = [
      { id: 3, name: 'C', shortName: 'C', tier: 1, status: 'active' },
      { id: 1, name: 'A', shortName: 'A', tier: 2, status: 'active' },
      { id: 2, name: 'B', shortName: 'B', tier: 1, status: 'active' },
      { id: 4, name: 'D', shortName: 'D', tier: 1, status: 'inactive' }
    ] as typeof component.characters;
    component.applySortPreset('activity');

    component.clearSort();

    expect(component.activeSortPreset).toBe('default');
    expect(component.sortSummaryLabels).toEqual(['Tier Asc', 'Status Asc', 'ID Asc']);
    expect(component.filteredCharacters.map(character => character.id)).toEqual([2, 3, 4, 1]);
  });

  it('adds unique sorts beyond three and stops when all fields are used', () => {
    for (let index = 0; index < 10; index++) component.addSort();

    expect(component.sorts.length).toBe(component.sortOptions.length);
    expect(new Set(component.sorts.map(sort => sort.field)).size).toBe(component.sorts.length);
    expect(component.activeSortPreset).toBeUndefined();
    component.updateSortField(0, 'status');
    expect(component.sorts[0].field).toBe('tier');

    component.applySortPreset('activity');
    expect(component.sorts.length).toBe(5);
    expect(component.activeSortPreset).toBe('activity');
  });

  it('changes sort priority when reordered and uses remaining rules after removal', () => {
    component.characters = [
      { id: 1, name: 'A', shortName: 'A', tier: 2, status: 'active' },
      { id: 2, name: 'B', shortName: 'B', tier: 1, status: 'inactive' }
    ] as typeof component.characters;
    expect(component.filteredCharacters.map(character => character.id)).toEqual([2, 1]);

    component.moveSort(1, -1);
    expect(component.sortSummaryLabels).toEqual(['Status Asc', 'Tier Asc', 'ID Asc']);
    expect(component.filteredCharacters.map(character => character.id)).toEqual([1, 2]);
    component.removeSort(0);
    expect(component.filteredCharacters.map(character => character.id)).toEqual([2, 1]);
    component.moveSort(0, -1);
    component.moveSort(component.sorts.length - 1, 1);
    expect(component.sortSummaryLabels).toEqual(['Tier Asc', 'ID Asc']);
    while (component.sorts.length) component.removeSort(0);
    expect(component.sortSummaryLabels).toEqual([]);
    expect(component.filteredCharacters.map(character => character.id)).toEqual([1, 2]);
    component.addSort();
    expect(component.sortSummaryLabels).toEqual(['Tier Asc']);
  });

  it('renders editable rows with add, remove, and reorder controls', () => {
    component.showSortOptions = true;
    fixture.detectChanges();
    const editor: HTMLElement = fixture.nativeElement.querySelector('#sort-editor');
    expect(editor.querySelectorAll('.sort-rule').length).toBe(3);
    (editor.querySelector('[aria-label="Move sort 2 up"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.sorts[0].field).toBe('status');
    (editor.querySelector('[aria-label="Remove sort 1"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(editor.querySelectorAll('.sort-rule').length).toBe(2);
    const add = Array.from(editor.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Add sort')!;
    add.click();
    fixture.detectChanges();
    expect(editor.querySelectorAll('.sort-rule').length).toBe(3);
  });

  it('breaks activity ties by status and then ID', () => {
    component.characters = [
      { id: 3, status: 'active' },
      { id: 1, status: 'inactive' },
      { id: 2, status: 'active' }
    ].map(character => ({
      ...character, name: 'Test', shortName: 'Test', tier: 1,
      weeklyChatCount: 2, timestamp: new Date('2026-01-01')
    })) as typeof component.characters;
    component.applySortPreset('activity');
    expect(component.filteredCharacters.map(character => character.id)).toEqual([2, 3, 1]);
  });

  it('combines multiple checked statuses and tiers and clears the filters', () => {
    component.characters = [
      { id: 1, status: 'active', tier: 1 },
      { id: 2, status: 'inactive', tier: 2 },
      { id: 3, status: 'retired', tier: 2 },
      { id: 4, status: 'active', tier: 3 }
    ].map(character => ({ ...character, name: 'Test', shortName: 'Test' })) as typeof component.characters;
    component.toggleStatusFilter('active');
    component.toggleStatusFilter('inactive');
    component.toggleTierFilter(1);
    component.toggleTierFilter(2);
    expect(component.filteredCharacters.map(character => character.id)).toEqual([1, 2]);
    expect(component.hasActiveFilters).toBeTrue();
    component.toggleStatusFilter('inactive');
    expect(component.filteredCharacters.map(character => character.id)).toEqual([1]);
    component.clearFilters();
    expect(component.hasActiveFilters).toBeFalse();
    expect(component.filteredCharacters.length).toBe(4);
    fixture.detectChanges();
    const groups = fixture.nativeElement.querySelectorAll('.filter-checklist');
    expect(groups.length).toBe(2);
    (groups[0].querySelectorAll('input')[1] as HTMLInputElement).click();
    fixture.detectChanges();
    expect(component.selectedStatuses).toEqual(['active']);
    (groups[0].querySelector('input') as HTMLInputElement).click();
    fixture.detectChanges();
    expect(component.selectedStatuses).toEqual([]);
  });

  it('closes filters on outside clicks while keeping checklist clicks open', () => {
    const dropdowns: NodeListOf<HTMLDetailsElement> = fixture.nativeElement.querySelectorAll('details.filter-pill');
    for (const dropdown of dropdowns) {
      dropdown.open = true;
      (dropdown.querySelector('input') as HTMLInputElement).click();
      expect(dropdown.open).toBeTrue();
      (fixture.nativeElement.querySelector('h1') as HTMLElement).click();
      expect(dropdown.open).toBeFalse();
      dropdown.open = true;
      document.body.click();
      expect(dropdown.open).toBeFalse();
    }
  });

  it('orders status choices and groups future and me under Other', () => {
    component.characters = ['future', 'me', 'active', 'retired side'].map((status, index) => ({
      id: index + 1, status, tier: 1, name: 'Test', shortName: 'Test'
    })) as typeof component.characters;
    fixture.detectChanges();
    const labels = Array.from(fixture.nativeElement.querySelectorAll('[aria-label="Statuses"] label') as NodeListOf<HTMLElement>);
    expect(labels.map(label => label.textContent?.trim())).toEqual([
      'Any status', 'Active', 'Inactive', 'Side', 'Inactive Side', 'Retired', 'Retired Side', 'Other'
    ]);
    component.toggleStatusFilter('other');
    expect(component.filteredCharacters.map(character => character.id)).toEqual([1, 2]);
    expect(component.activeFilterLabels).toEqual(['Status: Other']);
    component.toggleStatusFilter('active');
    expect(component.filteredCharacters.map(character => character.id).sort()).toEqual([1, 2, 3]);
  });

  it('exports only the approved character fields in their defined order', () => {
    const text = (component as any).createTrimmedCharactersText([{
      id: 1,
      name: 'Example Character',
      shortName: 'Example',
      status: 'active',
      tier: 1,
      defaultTier: 1,
      chatCount: 0,
      weeklyChatCount: 0,
      timestamp: null,
      straightforward: true,
      creationDate: '2026-01-01',
      birthday: 'January 2',
      interests: 'Testing',
      peeves: '',
      purpose: 'Demonstrate text export',
      funFact: 'This is a fixture',
      description: 'An example character',
      note: 'Keep this note',
      pronouns: 'they/them'
    }]);

    expect(text.split('\n')).toEqual([
      'Name: Example Character',
      'Creation Date: 2026-01-01',
      'Birthday: January 2',
      'Interests: Testing',
      'Purpose: Demonstrate text export',
      'Fun Fact: This is a fixture',
      'Description: An example character',
      'Note: Keep this note'
    ]);
    expect(text).not.toContain('Straightforward');
    expect(text).not.toContain('Pronouns');
  });
});
