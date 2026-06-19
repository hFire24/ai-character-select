import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Character } from '../../services/character.service';
import { CharacterItem } from '../character-item/character-item';

interface LastChattedCharacter {
  character: Character;
  timestamp: Date;
  chatCount: number;
  weeklyChatCount: number;
}

interface CharacterListBackup {
  version: 1;
  exportedAt: string;
  localStorage: Record<string, string>;
}

@Component({
  selector: 'app-character-list',
  imports: [CommonModule, FormsModule, RouterLink, CharacterItem],
  templateUrl: 'character-list.html',
  styleUrl: 'character-list.scss'
})
export class CharacterList {
  private readonly storageKeyPrefixes = [
    'chatLinkTimestamp_',
    'chatLinkCounter_',
    'chatLinkHistory_'
  ];

  @Input() lastChattedCharacters: LastChattedCharacter[] = [];
  @Input() neverChattedCharacters: Character[] = [];
  @Input() isDesktop = false;
  @Output() selectCharacter = new EventEmitter<Character>();
  @Output() refreshData = new EventEmitter<void>();

  sortType: 'date' | 'totalCount' | 'weeklyCount' = 'date';

  get numActiveChats(): number {
    // Count characters with custom chat links stored in localStorage
    return Object.keys(localStorage).filter(key => 
      key.startsWith('chatLink_') && 
      !key.startsWith('chatLinkTimestamp_') && 
      !key.startsWith('chatLinkCounter_')
    ).length;
  }

  get activeChattedCharacters(): LastChattedCharacter[] {
    return this.sortCharacters(
      this.lastChattedCharacters.filter(item => this.hasActiveChat(item.character))
    );
  }

  get thisWeekChattedCharacters(): LastChattedCharacter[] {
    const oneWeekAgo = this.getOneWeekAgo();
    const retiredCharacterIds = this.retiredChattedCharacterIds;
    
    return this.sortCharacters(
      this.lastChattedCharacters.filter(item => {
        const chatDate = new Date(item.timestamp);
        chatDate.setHours(0, 0, 0, 0);
        return !this.hasActiveChat(item.character) &&
          !retiredCharacterIds.has(item.character.id) &&
          chatDate.getTime() >= oneWeekAgo.getTime();
      })
    );
  }

  get olderChattedCharacters(): LastChattedCharacter[] {
    const oneWeekAgo = this.getOneWeekAgo();
    const retiredCharacterIds = this.retiredChattedCharacterIds;
    
    return this.sortCharacters(
      this.lastChattedCharacters.filter(item => {
        const chatDate = new Date(item.timestamp);
        chatDate.setHours(0, 0, 0, 0);
        return !this.hasActiveChat(item.character) &&
          !retiredCharacterIds.has(item.character.id) &&
          chatDate.getTime() < oneWeekAgo.getTime();
      })
    );
  }

  get retiredChattedCharacters(): LastChattedCharacter[] {
    const oldestFirst = [...this.lastChattedCharacters].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    const retiredCharacters: LastChattedCharacter[] = [];

    for (const item of oldestFirst) {
      if (item.character.status !== 'retired') break;
      if (!this.hasActiveChat(item.character)) retiredCharacters.push(item);
    }

    return retiredCharacters;
  }

  private get retiredChattedCharacterIds(): Set<number> {
    return new Set(this.retiredChattedCharacters.map(item => item.character.id));
  }

  private getOneWeekAgo(): Date {
    const oneWeekAgo = new Date();
    oneWeekAgo.setHours(0, 0, 0, 0);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
    return oneWeekAgo;
  }

  private hasActiveChat(character: Character): boolean {
    return localStorage.getItem(`chatLink_${character.id ?? 'unknown'}`) !== null;
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

  exportData() {
    const storedData: Record<string, string> = {};

    Object.keys(localStorage)
      .filter(key => this.isCharacterListStorageKey(key))
      .sort()
      .forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) storedData[key] = value;
      });

    const backup: CharacterListBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      localStorage: storedData
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `character-list-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importData(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result)) as Partial<CharacterListBackup>;
        if (!this.isValidBackup(backup)) {
          throw new Error('The selected file is not a valid character-list backup.');
        }

        Object.keys(localStorage)
          .filter(key => this.isCharacterListStorageKey(key))
          .forEach(key => localStorage.removeItem(key));

        Object.entries(backup.localStorage).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });

        this.refreshData.emit();
        alert('Character-list data imported successfully.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to import the file.';
        alert(message);
      } finally {
        input.value = '';
      }
    };
    reader.onerror = () => {
      alert('Unable to read the selected file.');
      input.value = '';
    };
    reader.readAsText(file);
  }

  private isCharacterListStorageKey(key: string): boolean {
    return this.storageKeyPrefixes.some(prefix => key.startsWith(prefix));
  }

  private isValidBackup(backup: Partial<CharacterListBackup>): backup is CharacterListBackup {
    if (
      backup.version !== 1 ||
      typeof backup.exportedAt !== 'string' ||
      !backup.localStorage ||
      typeof backup.localStorage !== 'object' ||
      Array.isArray(backup.localStorage)
    ) {
      return false;
    }

    return Object.entries(backup.localStorage).every(
      ([key, value]) => this.isCharacterListStorageKey(key) && typeof value === 'string'
    );
  }

  resetAllChatLinks() {
    const confirmed = confirm('Are you sure you want to reset all chat links to their defaults?');
    if (confirmed) {
      // Remove all chatLink_* keys from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chatLink_') && !key.startsWith('chatLinkTimestamp_') && !key.startsWith('chatLinkCounter_')) {
          localStorage.removeItem(key);
        }
      });
      alert('All chat links have been reset to their defaults.');
      // Notify parent to refresh the data
      this.refreshData.emit();
    }
  }
}
