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

@Component({
  selector: 'app-character-list',
  imports: [CommonModule, FormsModule, RouterLink, CharacterItem],
  templateUrl: 'character-list.html',
  styleUrl: 'character-list.scss'
})
export class CharacterList {
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

  get todayChattedCharacters(): LastChattedCharacter[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.sortCharacters(
      this.lastChattedCharacters.filter(item => {
        const chatDate = new Date(item.timestamp);
        chatDate.setHours(0, 0, 0, 0);
        return chatDate.getTime() === today.getTime();
      })
    );
  }

  get thisWeekChattedCharacters(): LastChattedCharacter[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 6);
    
    return this.sortCharacters(
      this.lastChattedCharacters.filter(item => {
        const chatDate = new Date(item.timestamp);
        chatDate.setHours(0, 0, 0, 0);
        return chatDate.getTime() < today.getTime() && chatDate.getTime() >= oneWeekAgo.getTime();
      })
    );
  }

  get olderChattedCharacters(): LastChattedCharacter[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 6);
    
    return this.sortCharacters(
      this.lastChattedCharacters.filter(item => {
        const chatDate = new Date(item.timestamp);
        chatDate.setHours(0, 0, 0, 0);
        return chatDate.getTime() < oneWeekAgo.getTime();
      })
    );
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
