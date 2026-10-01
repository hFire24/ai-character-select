import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Groups } from './groups';
import { of } from 'rxjs';
import { Character, CharacterService } from '../../services/character.service';
import { CharacterIconViewport } from '../../directives/character-icon';
import { signal } from '@angular/core';

describe('Groups', () => {
  let component: Groups;
  let fixture: ComponentFixture<Groups>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Groups],
      providers: [
        { provide: CharacterIconViewport, useValue: { compact: signal(false) } },
        { provide: CharacterService, useValue: {
          getCharacters: () => of([
        { id: 13, name: 'Alice Example', shortName: 'Ali', img: '', color: 'blue', emotion: 'joy', status: 'active', link: '' },
        { id: 27, name: 'Runa', shortName: 'Runa', img: '', color: 'purple', emotion: 'angry', status: 'active', link: '' },
        { id: 9999, name: 'Visitor', shortName: 'Visitor', img: '', color: 'white', emotion: 'joy angry', status: 'active', link: '' }
          ] as Character[]),
          getChatGPT: () => of([]),
          getAllowedTiersForStatus: () => []
        } }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Groups);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('searches and selects all dynamic groups by Emotion or Color category', () => {
    for (const type of ['emotion', 'color']) {
      component.clearSearch();
      component.searchTerm = type;
      const category = component.searchResults.find(item => item.kind === 'category' && item.id === type)!;
      const expected = component.dynamicGroups.filter(group => group.type.includes(type));
      expect(component.searchResults.filter(item => item.kind === 'dynamic').map(item => item.id)).toEqual(expected.map(group => group.id));
      component.addSearchSelection(category);
      expect(component.visibleGroups).toEqual(expected);
      const group = expected[0];
      component.addSearchSelection({ kind: 'dynamic', id: group.id, name: group.name });
      expect(component.visibleGroups).toEqual(expected);
      component.removeSearchSelection(category);
      expect(component.visibleGroups).toEqual([group]);
    }
  });


  it('searches dynamic colors, exact pure emotions, and inclusive mixed emotions', () => {
    const cases = [
      { query: ' All   PURPLE characters ', id: 'color:purple', members: [27] },
      { query: 'all pure joy characters', id: 'pure-emotion:joy', members: [13] },
      { query: 'all angry characters', id: 'emotion:angry', members: [27, 9999] },
      { query: 'mixed joy', id: 'mixed-emotion:joy', members: [9999] }
    ];
    for (const example of cases) {
      component.clearSearch();
      component.searchTerm = example.query;
      const result = component.searchResults.find(item => item.kind === 'dynamic' && item.id === example.id)!;
      expect(result).toBeDefined();
      component.addSearchSelection(result);
      expect(component.visibleGroups.length).toBe(1);
      expect(component.visibleGroups[0].characters.map(character => character.id)).toEqual(example.members);
    }
  });

  it('combines dynamic selections with authored groups and removes them independently', () => {
    component.searchTerm = 'purple';
    const selection = component.searchResults.find(item => item.kind === 'dynamic')!;
    component.addSearchSelection(selection);
    component.addSearchSelection(selection);
    const group = component.groups[0];
    component.addSearchSelection({ kind: 'group', id: group.id, name: group.name });
    expect(component.visibleGroups.map(item => item.id)).toEqual([group.id, 'color:purple']);
    component.searchTerm = 'purple';
    expect(component.searchResults.some(item => item.kind === 'dynamic')).toBeTrue();
    component.removeSearchSelection(selection);
    expect(component.visibleGroups).toEqual([group]);
    component.showAllCategories();
    expect(component.searchSelections).toEqual(component.categories);
    expect(component.visibleGroups.length).toBe(
      component.groups.filter(item => item.type.length).length + component.dynamicGroups.length
    );
    component.clearSearch();
    expect(component.visibleGroups).toEqual([]);
  });

  it('showAllCategories replaces existing selections with every category', () => {
    const category = component.categories.find(item => item.id === 'clothes')!;
    component.addSearchSelection(category);
    component.addSearchSelection({ kind: 'character', id: 27, name: 'Runa' });
    component.showAllCategories();
    expect(component.searchSelections).toEqual(component.categories);
    expect(component.searchSelections.every(item => item.kind === 'category')).toBeTrue();
    expect(component.visibleGroups.some(item => item.name === 'Groupless Characters')).toBeTrue();
  });

  it('lets users select and remove a dynamic group through the page', () => {
    component.searchTerm = 'all purple characters';
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.search-results .selection-kind')!.textContent).toContain('Dynamic group');
    (element.querySelector('.add-result') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelector('.group-card h2')!.textContent).toContain(
      component.dynamicGroups.find(group => group.id === 'color:purple')!.name
    );
    expect(element.querySelectorAll('.group-card .character').length).toBe(1);
    component.searchTerm = 'all purple characters';
    fixture.detectChanges();
    (element.querySelector('.remove-result') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.group-card').length).toBe(0);
  });

  it('renders description emojis upright while keeping description text italic', () => {
    component.searchTerm = 'pure joy';
    const selection = component.searchResults.find(item => item.id === 'pure-emotion:joy')!;
    component.addSearchSelection(selection);
    fixture.detectChanges();
    const description: HTMLElement = fixture.nativeElement.querySelector('.group-description');
    const emoji: HTMLElement = description.querySelector('.description-emoji')!;
    expect(emoji.textContent).toBe('😀');
    expect(getComputedStyle(description).fontStyle).toBe('italic');
    expect(getComputedStyle(emoji).fontStyle).toBe('normal');
  });

  it('finds princesses in either category and shows them once when both are selected', () => {
    for (const query of ['canon', 'clothes']) {
      component.searchTerm = query;
      expect(component.searchResults.some(item => item.kind === 'group' && item.name === 'Pretty Little Princesses')).toBeTrue();
    }
    const canon = component.categories.find(item => item.id === 'canon')!;
    const attire = component.categories.find(item => item.id === 'clothes')!;
    component.addSearchSelection(canon);
    component.addSearchSelection(attire);
    expect(component.visibleGroups.filter(group => group.name === 'Pretty Little Princesses').length).toBe(1);
    component.removeSearchSelection(canon);
    expect(component.visibleGroups.some(group => group.name === 'Pretty Little Princesses')).toBeTrue();
    component.removeSearchSelection(attire);
    expect(component.visibleGroups).toEqual([]);
  });

  it('finds attire groups by category name and its clothes alias', () => {
    for (const query of [' CLOTHES ', 'attire', 'equipment', 'accessories']) {
      component.searchTerm = query;
      expect(component.searchResults).toContain(jasmine.objectContaining({
        kind: 'category', id: 'clothes', name: 'Attire & Equipment'
      }));
      const groups = component.searchResults.filter(item => item.kind === 'group');
      expect(groups.map(item => item.name)).toContain('Hammer Wielders');
      expect(groups.map(item => item.name)).toContain('Maids');
      expect(groups.map(item => item.name)).not.toContain('Twintails');
    }
  });

  it('combines categories with groups and characters and retains overlaps on removal', () => {
    const category = component.categories.find(item => item.id === 'clothes')!;
    component.addSearchSelection(category);
    expect(component.visibleGroups).toEqual(component.groups.filter(group => group.type.includes('clothes')));
    component.addSearchSelection(category);
    expect(component.searchSelections.length).toBe(1);
    const hair = component.categories.find(item => item.id === 'hair')!;
    component.addSearchSelection(hair);
    const hats = component.groups.find(group => group.name === 'Top Hat Wearers')!;
    component.addSearchSelection({ kind: 'group', id: hats.id, name: hats.name });
    component.addSearchSelection({ kind: 'character', id: 27, name: 'Runa' });
    expect(component.visibleGroups).toEqual(component.groups.filter(group =>
      group.type.includes('clothes') || group.type.includes('hair') || group.characters.some(character => character.id === 27)));
    component.removeSearchSelection(category);
    expect(component.visibleGroups).toContain(hats);
    expect(component.visibleGroups.some(group => group.name === 'Groupless Characters')).toBeFalse();
    component.clearSearch();
    expect(component.visibleGroups).toEqual([]);
  });

  it('adds a category from search results and displays its groups in definition order', () => {
    component.searchTerm = 'clothes';
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    (element.querySelector('.add-result') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelector('.search-chip')).toBeNull();
    expect(component.searchSelections).toContain(jasmine.objectContaining({ id: 'clothes' }));
    expect(Array.from(element.querySelectorAll('.group-card h2')).map(heading => heading.textContent!.trim()))
      .toEqual(component.groups.filter(group => group.type.includes('clothes')).map(group => group.name));
    component.searchTerm = 'clothes';
    expect(component.searchResults.some(item => item.kind === 'category')).toBeTrue();
  });

  it('matches partial group names and full or short character names regardless of case', () => {
    component.searchTerm = '  hat WEAR  ';
    expect(component.searchResults.some(result => result.name === 'Top Hat Wearers')).toBeTrue();
    component.searchTerm = 'example';
    expect(component.searchResults.map(result => result.id)).toContain(13);
    component.searchTerm = 'ALI';
    expect(component.searchResults.some(result => result.kind === 'character' && result.id === 13)).toBeTrue();
    component.searchTerm = '   ';
    expect(component.searchResults).toEqual([]);
  });

  it('combines groups and all memberships of multiple characters without duplicates', () => {
    const group = component.groups.find(group => group.name === 'Music Enjoyers')!;
    component.addSearchSelection({ kind: 'group', id: group.id, name: group.name });
    expect(component.visibleGroups).toEqual([group]);
    for (const id of [13, 27]) {
      component.addSearchSelection({ kind: 'character', id, name: 'Character' });
    }
    const expected = component.groups.filter(item => item.id === group.id ||
      item.characters.some(character => [13, 27].includes(character.id)));
    expect(component.visibleGroups).toEqual(expected);
    expect(new Set(component.visibleGroups.map(item => item.id)).size).toBe(expected.length);
    expect(component.visibleGroups.every(item => item.characters === component.groups.find(g => g.id === item.id)!.characters)).toBeTrue();
  });

  it('prevents duplicate selections and retains overlapping groups when a selection is removed', () => {
    const group = component.groups.find(group => group.name === 'Top Hat Wearers')!;
    const selection = { kind: 'group' as const, id: group.id, name: group.name };
    component.addSearchSelection(selection);
    component.addSearchSelection(selection);
    expect(component.searchSelections.length).toBe(1);
    component.searchTerm = group.name;
    expect(component.searchResults.some(result => result.kind === 'group' && result.id === group.id)).toBeTrue();
    component.addSearchSelection({ kind: 'character', id: 13, name: 'Alice Example' });
    component.removeSearchSelection(selection);
    expect(component.visibleGroups).toContain(group);
    component.clearSearch();
    expect(component.visibleGroups).toEqual([]);
    expect(component.searchTerm).toBe('');
  });

  it('finds the groupless collection for characters without other memberships', () => {
    component.addSearchSelection({ kind: 'character', id: 9999, name: 'Visitor' });
    expect(component.visibleGroups.map(group => group.name)).toEqual(['Groupless Characters']);
  });

  it('lets users add a search match and clear their selections through the page', () => {
    const element: HTMLElement = fixture.nativeElement;
    const input = element.querySelector('input')!;
    input.value = 'music enjoy';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (element.querySelector('.add-result') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.group-card').length).toBe(1);
    expect(element.querySelector('.group-card h2')!.textContent).toContain('Music Enjoyers');
    expect(input.value).toBe('');
    (element.querySelector('.clear-search') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.group-card').length).toBe(0);
  });

  it('keeps generational placements in their own category instead of Meta', () => {
    const generational = component.categories.find(item => item.id === 'generational')!;
    const meta = component.categories.find(item => item.id === 'meta')!;
    expect(generational.name).toBe('Generational');
    component.addSearchSelection(generational);
    expect(component.visibleGroups.map(group => group.name)).toEqual([
      'Generational Champions',
      'Generational Last Places',
      'Generational Cutest',
      'Generational Least Cute'
    ]);
    component.replaceSearchSelection(meta);
    expect(component.visibleGroups.some(group => group.name.startsWith('Generational'))).toBeFalse();
  });

  it('replaces the selection when a character name is clicked and dismisses the results', () => {
    component.addSearchSelection({ kind: 'group', id: component.groups[0].id, name: component.groups[0].name });
    component.searchTerm = 'Alice';
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.group-search')).toBeTruthy();
    expect(element.querySelector('.search-results')).toBeTruthy();
    (element.querySelector('.result-name') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelector('.group-search')).toBeTruthy();
    expect(element.querySelector('.search-results')).toBeNull();
    expect((element.querySelector('#group-search-input') as HTMLInputElement).value).toBe('');
    expect(component.searchSelections).toEqual([jasmine.objectContaining({
      kind: 'character', id: 13, name: 'Alice Example', shortName: 'Ali'
    })]);
  });

  it('supports add, replace, and remove and dismisses results after each action', () => {
    const element: HTMLElement = fixture.nativeElement;
    component.searchTerm = 'music enjoy';
    fixture.detectChanges();
    const add: HTMLButtonElement = element.querySelector('.add-result')!;
    const replace: HTMLButtonElement = element.querySelector('.replace-result')!;
    const remove: HTMLButtonElement = element.querySelector('.remove-result')!;
    expect(add.disabled).toBeFalse();
    expect(remove.disabled).toBeTrue();
    add.click();
    fixture.detectChanges();
    expect(element.querySelector('.search-results')).toBeNull();
    expect(element.querySelector('.search-chip')).toBeNull();

    component.searchTerm = 'top hat';
    fixture.detectChanges();
    (element.querySelector('.replace-result') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.searchSelections.map(item => item.name)).toEqual(['Top Hat Wearers']);
    expect(element.querySelector('.search-results')).toBeNull();

    component.searchTerm = 'top hat';
    fixture.detectChanges();
    (element.querySelector('.remove-result') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.searchSelections).toEqual([]);
    expect(element.querySelector('.search-results')).toBeNull();
    expect(element.querySelector('.clear-search')).toBeNull();
  });

  it('places Clear all with the category and compact controls', () => {
    component.addSearchSelection({ kind: 'character', id: 27, name: 'Runa' });
    fixture.detectChanges();
    const actions: HTMLElement = fixture.nativeElement.querySelector('.group-actions');
    expect(actions.querySelector('.show-all-categories')).toBeTruthy();
    expect(actions.querySelector('.clear-search')).toBeTruthy();
    expect(actions.querySelector('.compact-toggle')).toBeTruthy();
  });

  it('shows an empty search message without discarding existing selections', () => {
    component.addSearchSelection({ kind: 'character', id: 27, name: 'Runa' });
    const groups = component.visibleGroups;
    component.searchTerm = 'no such name';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.search-empty').textContent).toContain('No matches');
    expect(component.visibleGroups).toEqual(groups);
  });

  it('starts empty and returns to empty after removing the last selection', () => {
    expect(component.visibleGroups).toEqual([]);
    expect(fixture.nativeElement.querySelectorAll('.group-card').length).toBe(0);
    const selection = { kind: 'character' as const, id: 27, name: 'Runa' };
    component.addSearchSelection(selection);
    component.removeSearchSelection(selection);
    expect(component.visibleGroups).toEqual([]);
  });

  it('sorts selections by definition order instead of addition order', () => {
    for (const name of ['Groupless Characters', 'Top Hat Wearers', 'Music Enjoyers']) {
      const group = component.groups.find(item => item.name === name)!;
      component.addSearchSelection({ kind: 'group', id: group.id, name });
    }
    component.addSearchSelection({ kind: 'character', id: 13, name: 'Alice Example' });
    component.addSearchSelection({ kind: 'character', id: 27, name: 'Runa' });
    expect(component.searchSelections.map(item => item.name)).toEqual([
      'Music Enjoyers', 'Runa', 'Top Hat Wearers', 'Alice Example', 'Groupless Characters'
    ]);
  });

  it('toggles compact mode through an accessible control', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.compact-toggle');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('.groups-container.compact-mode')).toBeTruthy();
    button.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.compact-mode')).toBeNull();
  });

  it('forces compact mode on mobile and restores the desktop preference after resizing', () => {
    const viewport = TestBed.inject(CharacterIconViewport);
    viewport.compact.set(true);
    fixture.detectChanges();
    expect(component.compactMode).toBeTrue();
    expect(fixture.nativeElement.querySelector('.compact-toggle')).toBeNull();
    expect(fixture.nativeElement.querySelector('.groups-container.compact-mode')).toBeTruthy();
    component.compactMode = false;
    expect(component.compactMode).toBeTrue();
    viewport.compact.set(false);
    fixture.detectChanges();
    expect(component.compactMode).toBeFalse();
    expect(fixture.nativeElement.querySelector('.compact-toggle')).toBeTruthy();
    component.compactMode = true;
    viewport.compact.set(true);
    component.compactMode = false;
    viewport.compact.set(false);
    expect(component.compactMode).toBeTrue();
  });
});
