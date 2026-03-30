import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, RelativeDatePipe, RouterLink],
  templateUrl: 'character-list.html',
  styleUrl: 'character-list.scss'
})
export class CharacterList {
  @Input() lastChattedCharacters: LastChattedCharacter[] = [];
  @Input() neverChattedCharacters: Character[] = [];
  @Input() isDesktop = false;
  @Output() selectCharacter = new EventEmitter<Character>();
  @Output() refreshData = new EventEmitter<void>();

  sortByCount = false; // false = sort by date, true = sort by count

  get numActiveChats(): number {
    // Count characters with custom chat links stored in localStorage
    return Object.keys(localStorage).filter(key => 
      key.startsWith('chatLink_') && 
      !key.startsWith('chatLinkTimestamp_') && 
      !key.startsWith('chatLinkCounter_')
    ).length;
  }

  get sortedLastChattedCharacters(): LastChattedCharacter[] {
    if (this.sortByCount) {
      return [...this.lastChattedCharacters].sort((a, b) => b.chatCount - a.chatCount);
    }
    return this.lastChattedCharacters;
  }

  toggleSort(): void {
    this.sortByCount = !this.sortByCount;
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
