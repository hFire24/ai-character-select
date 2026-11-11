import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Character } from '../../services/character.service';
import { CharacterItem } from '../character-item/character-item';
import { archiveAllChatLinks, getStoredChatLink } from '../../utils/chat-link-storage';

interface LastChattedCharacter {
  character: Character;
  timestamp: Date;
  chatCount: number;
  weeklyChatCount: number;
}

@Component({
  selector: 'app-character-list',
  imports: [CommonModule, FormsModule, CharacterItem],
  templateUrl: 'character-list.html',
  styleUrl: 'character-list.scss'
})
export class CharacterList {
  @Input() lastChattedCharacters: LastChattedCharacter[] = [];
  @Input() neverChattedCharacters: Character[] = [];
  @Input() isMobile = true;
  @Output() selectCharacter = new EventEmitter<Character>();
  @Output() refreshData = new EventEmitter<void>();

  sortType: 'date' | 'totalCount' | 'weeklyCount' = 'date';

  get numActiveChats(): number {
    // Count characters with custom chat links stored in localStorage
    return Object.keys(localStorage).filter(key => key.startsWith('chatLink_')).length;
  }

  get activeChattedCharacters(): LastChattedCharacter[] {
    return this.sortCharacters(
      this.lastChattedCharacters.filter(item => this.hasActiveChat(item.character))
    );
  }

  get thisWeekChattedCharacters(): LastChattedCharacter[] {
    const oneWeekAgo = this.getOneWeekAgo();
    const separatedCharacterIds = this.separatedChattedCharacterIds;
    
    return this.sortCharacters(
      this.lastChattedCharacters.filter(item => {
        const chatDate = new Date(item.timestamp);
        chatDate.setHours(0, 0, 0, 0);
        return !this.hasActiveChat(item.character) &&
          !separatedCharacterIds.has(item.character.id) &&
          chatDate.getTime() >= oneWeekAgo.getTime();
      })
    );
  }

  get olderChattedCharacters(): LastChattedCharacter[] {
    const oneWeekAgo = this.getOneWeekAgo();
    const separatedCharacterIds = this.separatedChattedCharacterIds;
    
    return this.sortCharacters(
      this.lastChattedCharacters.filter(item => {
        const chatDate = new Date(item.timestamp);
        chatDate.setHours(0, 0, 0, 0);
        return !this.hasActiveChat(item.character) &&
          !separatedCharacterIds.has(item.character.id) &&
          chatDate.getTime() < oneWeekAgo.getTime();
      })
    );
  }

  get retiredChattedCharacters(): LastChattedCharacter[] {
    const inactiveIds = new Set(this.inactiveChattedCharacters.map(item => item.character.id));
    const oldestFirst = [...this.lastChattedCharacters].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const retiredCharacters: LastChattedCharacter[] = [];

    for (const item of oldestFirst) {
      if (item.character.status !== 'retired' && item.character.status !== 'inactive') break;
      if (!this.hasActiveChat(item.character) && !inactiveIds.has(item.character.id)) {
        retiredCharacters.unshift(item);
      }
    }

    return retiredCharacters;
  }

  get inactiveChattedCharacters(): LastChattedCharacter[] {
    const oldestInactive = Math.min(...this.lastChattedCharacters
      .filter(item => item.character.status === 'inactive')
      .map(item => item.timestamp.getTime()));
    const oldestActive = Math.min(...this.lastChattedCharacters
      .filter(item => item.character.status === 'active')
      .map(item => item.timestamp.getTime()));

    if (!Number.isFinite(oldestInactive) || !Number.isFinite(oldestActive)) return [];

    return this.sortCharacters(this.lastChattedCharacters.filter(item =>
      !this.hasActiveChat(item.character) &&
      item.timestamp.getTime() >= oldestInactive &&
      item.timestamp.getTime() < oldestActive
    ));
  }

  get combinedChattedCharacters(): LastChattedCharacter[] {
    if (this.sortType === 'totalCount') {
      return this.sortCharacters(this.lastChattedCharacters);
    }

    if (this.sortType === 'weeklyCount') {
      return this.sortCharacters([
        ...this.activeChattedCharacters,
        ...this.thisWeekChattedCharacters
      ]);
    }

    return [];
  }

  get displayedOlderChattedCharacters(): LastChattedCharacter[] {
    return this.inactiveChattedCharacters.length < 4 ? [] : this.olderChattedCharacters;
  }

  get displayedInactiveChattedCharacters(): LastChattedCharacter[] {
    const inactive = this.inactiveChattedCharacters;
    return inactive.length < 4
      ? this.sortCharacters([...inactive, ...this.olderChattedCharacters])
      : inactive;
  }

  private get separatedChattedCharacterIds(): Set<number> {
    return new Set([
      ...this.retiredChattedCharacters,
      ...this.inactiveChattedCharacters
    ].map(item => item.character.id));
  }

  private getOneWeekAgo(): Date {
    const oneWeekAgo = new Date();
    oneWeekAgo.setHours(0, 0, 0, 0);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
    return oneWeekAgo;
  }

  private hasActiveChat(character: Character): boolean {
    return getStoredChatLink(character) !== null;
  }

  sortCharacters(characters: LastChattedCharacter[]): LastChattedCharacter[] {
    const sorted = [...characters];
    
    switch (this.sortType) {
      case 'totalCount':
        return sorted.sort((a, b) => b.chatCount - a.chatCount);
      case 'weeklyCount':
        return sorted.sort((a, b) => b.weeklyChatCount - a.weeklyChatCount);
      case 'date':
      default:
        return sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
  }

  onCharacterClick(character: Character) {
    this.selectCharacter.emit(character);
  }

  resetAllChatLinks() {
    const confirmed = confirm('Are you sure you want to reset all chat links to their defaults?');
    if (confirmed) {
      archiveAllChatLinks();
      alert('All chat links have been reset to their defaults.');
      // Notify parent to refresh the data
      this.refreshData.emit();
    }
  }
}
