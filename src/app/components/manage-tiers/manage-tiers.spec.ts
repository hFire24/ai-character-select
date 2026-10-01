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
