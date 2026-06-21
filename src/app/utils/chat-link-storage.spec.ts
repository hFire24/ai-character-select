import { Character } from '../services/character.service';
import {
  archiveAllChatLinks,
  archiveChatLink,
  getEffectiveChatLink,
  restoreChatLink,
  saveChatLink
} from './chat-link-storage';

describe('chat link storage', () => {
  const character = {
    id: 42,
    link: 'https://chatgpt.com/g/default'
  } as Character;

  beforeEach(() => localStorage.clear());

  it('archives an active link and falls back to the default link', () => {
    localStorage.setItem('chatLink_42', 'https://chatgpt.com/c/custom');

    expect(archiveChatLink(character)).toBeTrue();
    expect(localStorage.getItem('chatLink_42')).toBeNull();
    expect(localStorage.getItem('archivedChatLink_42')).toBe('https://chatgpt.com/c/custom');
    expect(getEffectiveChatLink(character)).toBe(character.link);
  });

  it('restores an archived link without changing tracking data', () => {
    localStorage.setItem('archivedChatLink_42', 'https://chatgpt.com/c/custom');
    localStorage.setItem('chatLinkTimestamp_42', '2026-01-01T00:00:00.000Z');

    expect(restoreChatLink(character)).toBeTrue();
    expect(localStorage.getItem('chatLink_42')).toBe('https://chatgpt.com/c/custom');
    expect(localStorage.getItem('archivedChatLink_42')).toBeNull();
    expect(localStorage.getItem('chatLinkTimestamp_42')).toBe('2026-01-01T00:00:00.000Z');
  });

  it('removes the archived link when a link is saved', () => {
    localStorage.setItem('archivedChatLink_42', 'https://chatgpt.com/c/old');

    saveChatLink(character, 'https://chatgpt.com/c/new');

    expect(localStorage.getItem('chatLink_42')).toBe('https://chatgpt.com/c/new');
    expect(localStorage.getItem('archivedChatLink_42')).toBeNull();
  });

  it('archives all active links without changing tracking data', () => {
    localStorage.setItem('chatLink_42', 'https://chatgpt.com/c/first');
    localStorage.setItem('chatLink_84', 'https://chatgpt.com/c/second');
    localStorage.setItem('chatLinkTimestamp_42', '2026-01-01T00:00:00.000Z');

    expect(archiveAllChatLinks()).toBe(2);
    expect(localStorage.getItem('archivedChatLink_42')).toBe('https://chatgpt.com/c/first');
    expect(localStorage.getItem('archivedChatLink_84')).toBe('https://chatgpt.com/c/second');
    expect(localStorage.getItem('chatLinkTimestamp_42')).toBe('2026-01-01T00:00:00.000Z');
  });
});
