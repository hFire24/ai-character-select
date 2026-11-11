import { CharacterModal } from '../character-modal/character-modal';
import { ChatManager } from './chat-manager';
import { Character } from '../../services/character.service';

describe('Character chat corrections', () => {
  let component: ChatManager;
  const character = { id: -123, shortName: "Test" } as Character;
  const previous = '2026-11-09T12:00:00.000Z';
  const latest = '2026-11-11T12:00:00.000Z';
  const link = 'https://chatgpt.com/c/abcdef12-3456';
  const keys = ['chatLink_', 'archivedChatLink_', 'chatLinkTimestamp_', 'chatLinkCounter_', 'chatLinkHistory_'];

  beforeEach(() => {
    component = new ChatManager({} as any);
    spyOn(component, 'loadActiveChats');
    localStorage.setItem('chatLink_-123', link);
    localStorage.setItem('archivedChatLink_-123', 'https://chatgpt.com/c/old');
    localStorage.setItem('chatLinkTimestamp_-123', latest);
    localStorage.setItem('chatLinkCounter_-123', '2');
    localStorage.setItem('chatLinkHistory_-123', JSON.stringify([previous, latest]));
  });

  afterEach(() => keys.forEach(key => localStorage.removeItem(key + '-123')));

  it('corrects only the link', () => {
    spyOn(window, 'prompt').and.returnValue(link + '?model=test');
    component.editChatLink(character);
    expect(localStorage.getItem('archivedChatLink_-123')).toBe('https://chatgpt.com/c/old');
    expect(localStorage.getItem('chatLink_-123')).toBe(link + '?model=test');
    expect(Number(localStorage.getItem('chatLinkCounter_-123'))).toBe(2);
    expect(localStorage.getItem('chatLinkTimestamp_-123')).toBe(latest);
    expect(JSON.parse(localStorage.getItem('chatLinkHistory_-123') || '[]')).toEqual([previous, latest]);
  });

  it('updates the timestamp and last appended history entry together', () => {
    const value = '2026-11-10T09:30:00';
    component.editLastTimestamp(character);
    component.saveLastTimestamp(value);
    expect(localStorage.getItem('chatLinkTimestamp_-123')).toBe(new Date(2026, 10, 10, 9, 30).toISOString());
    expect(JSON.parse(localStorage.getItem('chatLinkHistory_-123') || '[]')).toEqual([previous, new Date(2026, 10, 10, 9, 30).toISOString()]);
    expect(Number(localStorage.getItem('chatLinkCounter_-123'))).toBe(2);
    expect(localStorage.getItem('chatLink_-123')).toBe(link);
  });

  it('undoes the latest chat and restores the previous timestamp', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.undoLatestChat(character);
    expect(localStorage.getItem('chatLink_-123')).toBeNull();
    expect(localStorage.getItem('archivedChatLink_-123')).toBe('https://chatgpt.com/c/old');
    expect(Number(localStorage.getItem('chatLinkCounter_-123'))).toBe(1);
    expect(JSON.parse(localStorage.getItem('chatLinkHistory_-123') || '[]')).toEqual([previous]);
    expect(localStorage.getItem('chatLinkTimestamp_-123')).toBe(previous);
  });

  it('clears the timestamp after undoing the only entry and never makes the count negative', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    localStorage.setItem('chatLinkHistory_-123', JSON.stringify([latest]));
    localStorage.setItem('chatLinkCounter_-123', '0');
    component.undoLatestChat(character);
    expect(localStorage.getItem('chatLinkTimestamp_-123')).toBeNull();
    expect(Number(localStorage.getItem('chatLinkCounter_-123'))).toBe(0);
    expect(component.canUndoLatestChat(character)).toBeFalse();
  });

  it('leaves data unchanged when undo is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.undoLatestChat(character);
    expect(JSON.parse(localStorage.getItem('chatLinkHistory_-123') || '[]')).toEqual([previous, latest]);
    expect(Number(localStorage.getItem('chatLinkCounter_-123'))).toBe(2);
    expect(localStorage.getItem('chatLink_-123')).toBe(link);
  });
  const snapshot = () => keys.map(key => localStorage.getItem(key + '-123'));

  it('changes nothing when link editing is cancelled', () => {
    const before = snapshot();
    spyOn(window, 'prompt').and.returnValue(null);
    component.editChatLink(character);
    expect(snapshot()).toEqual(before);
  });

  it('changes nothing when timestamp editing is cancelled', () => {
    const before = snapshot();
    component.editLastTimestamp(character);
    component.cancelTimestampEdit();
    expect(snapshot()).toEqual(before);
  });

  it('edits an archived character timestamp in UTC without restoring its link', () => {
    localStorage.removeItem('chatLink_-123');
    component.editLastTimestamp(character);
    component.saveLastTimestamp('2026-11-10T08:15');
    expect(localStorage.getItem('chatLinkTimestamp_-123')).toBe(new Date(2026, 10, 10, 8, 15).toISOString());
    expect(JSON.parse(localStorage.getItem('chatLinkHistory_-123')!)).toEqual([previous, new Date(2026, 10, 10, 8, 15).toISOString()]);
    expect(localStorage.getItem('chatLink_-123')).toBeNull();
    expect(localStorage.getItem('archivedChatLink_-123')).toBe('https://chatgpt.com/c/old');
    expect(localStorage.getItem('chatLinkCounter_-123')).toBe('2');
  });

  it('does not allow undo without an archived chat link', () => {
    localStorage.removeItem('archivedChatLink_-123');
    const before = snapshot();
    expect(component.canUndoLatestChat(character)).toBeFalse();
    component.undoLatestChat(character);
    expect(snapshot()).toEqual(before);
  });

  it('archives the previous link when the character modal saves a new chat', () => {
    const modal = new CharacterModal({} as any, {} as any);
    modal.character = character;
    modal.chatLink = link;
    spyOn(window, 'prompt').and.returnValue(link + '?new=1');
    spyOn(window, 'alert');
    modal.updateChatLink();
    expect(localStorage.getItem('archivedChatLink_-123')).toBe(link);
    expect(localStorage.getItem('chatLink_-123')).toBe(link + '?new=1');
    expect(localStorage.getItem('chatLinkCounter_-123')).toBe('3');
    expect(JSON.parse(localStorage.getItem('chatLinkHistory_-123')!).length).toBe(3);
  });

  it('prefills the picker in local time without changing storage', () => {
    const before = snapshot();
    component.editLastTimestamp(character);
    const date = new Date(latest);
    expect(new Date(component.timestampInput).getTime()).toBe(date.getTime());
    expect(component.timestampInput.endsWith('Z')).toBeFalse();
    expect(snapshot()).toEqual(before);
  });

  it('ignores a save after cancellation', () => {
    const before = snapshot();
    component.editLastTimestamp(character);
    component.cancelTimestampEdit();
    component.saveLastTimestamp('2026-11-10T09:30:00');
    expect(snapshot()).toEqual(before);
  });

  it('prefills a valid minute-only browser input and preserves precision on an unchanged save', () => {
    const timestamp = '2026-11-11T12:34:56.789Z';
    localStorage.setItem('chatLinkTimestamp_-123', timestamp);
    localStorage.setItem('chatLinkHistory_-123', JSON.stringify([previous, timestamp]));
    component.editLastTimestamp(character);
    const input = document.createElement('input');
    input.type = 'datetime-local';
    input.step = '60';
    input.value = component.timestampInput;
    expect(input.value).not.toBe('');
    expect(input.validity.valid).toBeTrue();
    expect(input.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    component.saveLastTimestamp(input.value);
    expect(localStorage.getItem('chatLinkTimestamp_-123')).toBe(timestamp);
    expect(JSON.parse(localStorage.getItem('chatLinkHistory_-123')!)).toEqual([previous, timestamp]);
  });

  it('preserves original seconds and milliseconds when the local date and minute change', () => {
    localStorage.setItem('chatLinkTimestamp_-123', '2026-11-11T12:34:56.789Z');
    component.editLastTimestamp(character);
    component.saveLastTimestamp('2026-11-10T09:15');
    const expected = new Date(2026, 10, 10, 9, 15, 56, 789).toISOString();
    expect(localStorage.getItem('chatLinkTimestamp_-123')).toBe(expected);
    expect(JSON.parse(localStorage.getItem('chatLinkHistory_-123')!)).toEqual([previous, expected]);
    expect(localStorage.getItem('chatLinkCounter_-123')).toBe('2');
    expect(localStorage.getItem('chatLink_-123')).toBe(link);
  });

  it('cancels outside clicks without saving and keeps inside clicks open', () => {
    const before = snapshot();
    const dialog = document.createElement('dialog');
    spyOn(dialog, 'showModal');
    spyOn(dialog, 'close');
    spyOn(dialog, 'getBoundingClientRect').and.returnValue({ left: 100, right: 400, top: 100, bottom: 400 } as DOMRect);
    component.timestampDialog = { nativeElement: dialog };
    component.editLastTimestamp(character);
    component.onTimestampDialogClick({ target: dialog, clientX: 150, clientY: 150 } as unknown as MouseEvent);
    expect(component.timestampCharacter).toBe(character);
    component.onTimestampDialogClick({ target: dialog, clientX: 50, clientY: 50 } as unknown as MouseEvent);
    expect(component.timestampCharacter).toBeNull();
    expect(dialog.close).toHaveBeenCalled();
    expect(snapshot()).toEqual(before);
  });

});
