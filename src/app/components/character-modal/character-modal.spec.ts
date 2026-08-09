import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterModal } from './character-modal';

describe('CharacterModal', () => {
  let component: CharacterModal;
  let fixture: ComponentFixture<CharacterModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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

    it('includes a chat exactly the requested number of calendar days ago', () => {
      localStorage.setItem('chatLinkTimestamp_123', new Date(2026, 7, 2, 1).toISOString());

      expect(component.isLastChatWithinDays(7)).toBeTrue();
    });

    it('excludes a chat older than the requested number of calendar days', () => {
      localStorage.setItem('chatLinkTimestamp_123', new Date(2026, 7, 1, 23).toISOString());

      expect(component.isLastChatWithinDays(7)).toBeFalse();
    });
  });
});
