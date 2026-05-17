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
      'getCharactersPlusCriticizer',
      'getDefaultCharactersPlusCriticizer',
      'getAllowedTiersForStatus',
      'getDefaultTierForStatus',
      'isTierValidForStatus',
      'saveTierOverride',
      'clearTierOverride'
    ]
  );

  beforeEach(async () => {
    characterServiceSpy.getCharactersPlusCriticizer.and.returnValue(of([]));
    characterServiceSpy.getDefaultCharactersPlusCriticizer.and.returnValue(of([]));
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
});
