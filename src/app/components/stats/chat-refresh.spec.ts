import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { Stats } from './stats';
import { CharacterModal } from '../character-modal/character-modal';
import { CharacterItem } from '../character-item/character-item';
import { CharacterService } from '../../services/character.service';
import { DeviceService } from '../../services/device.service';

describe('Character list chat refresh', () => {
  const id = -456;
  const keys = ['chatLink_', 'archivedChatLink_', 'chatLinkTimestamp_', 'chatLinkCounter_', 'chatLinkHistory_'];

  afterEach(() => keys.forEach(key => localStorage.removeItem(key + id)));

  for (const firstChat of [false, true]) {
    it(`refreshes rendered stats after ${firstChat ? 'the first' : 'another'} chat is saved`, async () => {
      const character = {
        ...new CharacterModal({} as any, {} as any).character,
        id, name: 'Test', shortName: 'Test', status: 'active',
        link: 'https://chatgpt.com/g/default'
      };
      const service = {
        getCharacters: () => of([{ ...character }]),
        getChatGPT: () => of([]),
        getAllowedTiersForStatus: () => [1, 2, 3]
      };
      spyOn(CharacterModal.prototype, 'ngOnInit');
      spyOn(CharacterModal.prototype, 'ngOnChanges');
      if (!firstChat) {
        localStorage.setItem('chatLink_' + id, 'https://chatgpt.com/c/abcdef');
        localStorage.setItem('chatLinkTimestamp_' + id, '2020-01-01T00:00:00.000Z');
        localStorage.setItem('chatLinkCounter_' + id, '1');
        localStorage.setItem('chatLinkHistory_' + id, JSON.stringify(['2020-01-01T00:00:00.000Z']));
      }
      await TestBed.configureTestingModule({
        imports: [Stats],
        providers: [
          provideRouter([]),
          { provide: CharacterService, useValue: service },
          { provide: DeviceService, useValue: { isMobile: () => false } }
        ]
      }).compileComponents();
      const fixture = TestBed.createComponent(Stats);
      fixture.detectChanges();
      fixture.componentInstance.onCharacterClick(character);
      fixture.detectChanges();
      const modal = fixture.debugElement.query(By.directive(CharacterModal)).componentInstance as CharacterModal;
      modal.loadChatLink();
      spyOn(window, 'prompt').and.returnValue('https://chatgpt.com/c/abcdef12');
      spyOn(window, 'alert');
      modal.updateChatLink();
      fixture.detectChanges();
      const item = fixture.debugElement.query(By.directive(CharacterItem));
      expect(item.componentInstance.chatCount).toBe(firstChat ? 1 : 2);
      expect(item.componentInstance.weeklyChatCount).toBe(1);
      expect(item.componentInstance.timestamp.toISOString()).toBe(localStorage.getItem('chatLinkTimestamp_' + id));
      expect(item.nativeElement.textContent).toContain('Last Chat:');
      expect(item.nativeElement.textContent).toContain('1 last week');
      expect(fixture.componentInstance.neverChattedCharacters).toEqual([]);
      fixture.destroy();
    });
  }
});
