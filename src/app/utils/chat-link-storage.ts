import { Character } from '../services/character.service';

const chatLinkId = (character: Character): number | string => character.id ?? 'unknown';

export const getChatLinkKey = (character: Character): string =>
  `chatLink_${chatLinkId(character)}`;

export const getArchivedChatLinkKey = (character: Character): string =>
  `archivedChatLink_${chatLinkId(character)}`;

export const getStoredChatLink = (character: Character): string | null =>
  localStorage.getItem(getChatLinkKey(character));

export const getArchivedChatLink = (character: Character): string | null =>
  localStorage.getItem(getArchivedChatLinkKey(character));

export const getEffectiveChatLink = (character: Character): string =>
  getStoredChatLink(character) ?? character.link;

export const saveChatLink = (character: Character, chatLink: string): void => {
  localStorage.setItem(getChatLinkKey(character), chatLink);
  localStorage.removeItem(getArchivedChatLinkKey(character));
};

export const archiveChatLink = (character: Character): boolean => {
  const chatLink = getStoredChatLink(character);
  if (chatLink === null) return false;

  localStorage.setItem(getArchivedChatLinkKey(character), chatLink);
  localStorage.removeItem(getChatLinkKey(character));
  return true;
};

export const archiveAllChatLinks = (): number => {
  const chatLinkKeys = Object.keys(localStorage).filter(key => key.startsWith('chatLink_'));

  chatLinkKeys.forEach(key => {
    const chatLink = localStorage.getItem(key);
    if (chatLink !== null) {
      localStorage.setItem(`archivedChatLink_${key.slice('chatLink_'.length)}`, chatLink);
      localStorage.removeItem(key);
    }
  });

  return chatLinkKeys.length;
};

export const restoreChatLink = (character: Character): boolean => {
  const archivedChatLink = getArchivedChatLink(character);
  if (archivedChatLink === null) return false;

  localStorage.setItem(getChatLinkKey(character), archivedChatLink);
  localStorage.removeItem(getArchivedChatLinkKey(character));
  return true;
};
