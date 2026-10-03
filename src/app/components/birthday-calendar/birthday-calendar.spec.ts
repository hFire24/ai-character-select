import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Character, CharacterService } from '../../services/character.service';
import { DeviceService } from '../../services/device.service';

import { BirthdayCalendar } from './birthday-calendar';

describe('BirthdayCalendar', () => {
  let component: BirthdayCalendar;
  let fixture: ComponentFixture<BirthdayCalendar>;
  const character = (id: number, overrides: Partial<Character> = {}): Character => ({
    id, name: `Character ${id}`, shortName: `Character ${id}`, img: '', generation: 1,
    status: 'active', tier: 4, color: 'blue', moe: 1, futuristic: 1, mature: 1,
    emotion: '', pronouns: 'he/him', link: '', interests: '', purpose: '',
    funFact: '', description: '', birthday: 'October 3', ...overrides
  });
  const characters = [
    character(1),
    character(2, { status: 'retired' }),
    character(3, { status: 'retired', tier: 9, birthday: 'unknown' }),
    character(4, { status: 'side', parentId: 2 }),
    character(5, { status: 'side', parentId: 3 }),
    character(6, { status: 'side', parentId: 4 }),
    character(7, { status: 'side', parentId: 1 }),
    character(8, { status: 'inactive' }),
    character(9, { status: 'side', parentId: 99 }),
    character(10, { status: 'side', parentId: 11 }),
    character(11, { status: 'side', parentId: 10 }),
    character(12, { status: 'retired', tier: 9 }),
    character(14, { status: 'side', parentId: 13 })
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirthdayCalendar],
      providers: [
        { provide: CharacterService, useValue: {
          getCharactersSplitTwins: () => of(characters),
          getCharacters: () => of([...characters, character(13, { status: 'retired' })])
        } },
        { provide: DeviceService, useValue: { isPhone: () => false } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BirthdayCalendar);
    component = fixture.componentInstance;
    component.currentMonth = 9;
    component.currentYear = 2026;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('hides retired characters and their descendants in both views, then restores them', () => {
    const filterButton: HTMLButtonElement = fixture.nativeElement.querySelector('.retired-filter');
    filterButton.click();
    fixture.detectChanges();

    expect(filterButton.getAttribute('aria-pressed')).toBe('true');
    const expectedIds = [1, 7, 8, 9, 10, 11];
    expect(component.characters.map(character => character.id)).toEqual(expectedIds);
    expect(component.calendarDays.find(day => day.isCurrentMonth && day.date === 3)!
      .characters.map(character => character.id)).toEqual(expectedIds);
    expect(component.sortedBirthdayCharacters.map(entry => entry.character.id)).toEqual(expectedIds);

    filterButton.click();
    fixture.detectChanges();
    expect(filterButton.getAttribute('aria-pressed')).toBe('false');
    expect(component.characters.map(character => character.id)).toEqual([1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14]);
    expect(component.sortedBirthdayCharacters.length).toBe(12);
  });
});
