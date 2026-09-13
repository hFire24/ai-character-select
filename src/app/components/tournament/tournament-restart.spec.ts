import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Tournament } from './tournament';
import { CharacterService } from '../../services/character.service';

describe('Tournament restart button', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Tournament],
      providers: [{ provide: CharacterService, useValue: {
        getCharactersSplitTwins: () => of([
          { id: 1, shortName: 'Player', status: 'active', tier: 1, moe: 5 },
          { id: 2, shortName: 'Future', status: 'future', tier: 10, moe: 5 }
        ])
      } }]
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  for (const confirmed of [true, false]) {
    it(confirmed ? 'returns to setup and clears saved bracket' : 'preserves progress when canceled', () => {
      const fixture = TestBed.createComponent(Tournament);
      fixture.detectChanges();
      fixture.componentInstance.createBracket();
      fixture.detectChanges();
      fixture.detectChanges();
      const key = 'character-select.session.v1.tournament-bracket';
      expect(localStorage.getItem(key)).not.toBeNull();
      spyOn(window, 'confirm').and.returnValue(confirmed);
      const button = fixture.nativeElement.querySelector('app-tournament-bracket button.red-button') as HTMLButtonElement;
      button.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.tournamentCreated).toBe(!confirmed);
      expect(!!fixture.nativeElement.querySelector('app-tournament-bracket')).toBe(!confirmed);
      expect(localStorage.getItem(key) === null).toBe(confirmed);
      expect(new Tournament().tournamentCreated).toBe(!confirmed);
      fixture.destroy();
    });
  }
});
