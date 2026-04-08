import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Character } from '../../services/character.service';
import { RelativeDatePipe } from '../../pipes/relative-date.pipe';

interface LastChattedCharacter {
  character: Character;
  timestamp: Date;
  chatCount: number;
  weeklyChatCount: number;
}

@Component({
  selector: 'app-character-list',
  imports: [CommonModule, FormsModule, RelativeDatePipe, RouterLink],
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

  get sortedLastChattedCharacters(): LastChattedCharacter[] {
    const sorted = [...this.lastChattedCharacters];
    
    switch (this.sortType) {
      case 'totalCount':
        return sorted.sort((a, b) => b.chatCount - a.chatCount);
      case 'weeklyCount':
        return sorted.sort((a, b) => b.weeklyChatCount - a.weeklyChatCount);
      case 'date':
      default:
        return sorted; // Already sorted by date from parent
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
