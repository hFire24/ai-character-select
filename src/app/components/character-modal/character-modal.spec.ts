import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterModal } from './character-modal';

describe('CharacterModal', () => {
  let component: CharacterModal;
  let fixture: ComponentFixture<CharacterModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      imports: [CharacterModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isValidChatLink', () => {
    it('accepts a ChatGPT chat link with a query string after the chat id', () => {
      expect(
        component.isValidChatLink('https://chatgpt.com/c/abcdef12-3456?model=gpt-5')
      ).toBeTrue();
    });

    it('still accepts a ChatGPT chat link without a query string', () => {
      expect(component.isValidChatLink('https://chatgpt.com/c/abcdef12-3456')).toBeTrue();
    });
  });

  describe('isLastChatWithinDays', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2026, 7, 9, 12));
      component.character = { ...component.character, id: 123 };
    });

    afterEach(() => {
      localStorage.removeItem('chatLinkTimestamp_123');
      jasmine.clock().uninstall();
    });

    it('includes a chat exactly the requested number of days ago', () => {
      localStorage.setItem('chatLinkTimestamp_123', new Date(2026, 7, 2, 12).toISOString());

      expect(component.isLastChatWithinDays(7)).toBeTrue();
    });

    it('excludes a chat older than the requested number of calendar days', () => {
      localStorage.setItem('chatLinkTimestamp_123', new Date(2026, 7, 1, 23).toISOString());

      expect(component.isLastChatWithinDays(7)).toBeFalse();
    });
  });

  describe('chat flavor labels', () => {
    const expectedLabels = [
      ['Bitter'],
      ['Sweet', 'Bitter'],
      ['Sweet', 'Plain', 'Bitter'],
      ['Very Sweet', 'Sweet', 'Bitter', 'Very Bitter'],
      ['Very Sweet', 'Sweet', 'Plain', 'Bitter', 'Very Bitter'],
      ['Very Sweet', 'Sweet', 'Semi-Sweet', 'Semi-Bitter', 'Bitter', 'Very Bitter'],
      ['Very Sweet', 'Sweet', 'Semi-Sweet', 'Plain', 'Semi-Bitter', 'Bitter', 'Very Bitter']
    ];

    expectedLabels.forEach((labels, index) => {
      const total = index + 1;

      it(`uses the intended labels when ${total} character${total === 1 ? '' : 's'} remain`, () => {
        const actualLabels = labels.map((_, rank) =>
          (component as any).createChatFlavor(rank + 1, total, 'test pool').label
        );

        expect(actualLabels).toEqual(labels);
      });
    });
  });
  it('excludes default ChatGPT from flavor ranks and totals', () => {
    const chatGPT = { ...component.character, id: 0, status: 'active' };
    const first = { ...component.character, id: -801, status: 'active' };
    const second = { ...first, id: -802 };
    const modal = new CharacterModal({} as any, {
      getCharacters: () => of([first, second, chatGPT]),
      getChatGPT: () => of([chatGPT])
    } as any);
    modal.character = first;
    modal.loadChatFlavor();
    expect(modal.chatFlavor?.total).toBe(2);
    expect(modal.chatFlavor?.rank).toBe(2);
    modal.character = chatGPT;
    modal.loadChatFlavor();
    expect(modal.chatFlavor).toBeNull();
  });

});
