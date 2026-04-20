import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterService, Character } from '../../services/character.service';

@Component({
  selector: 'app-id-checker',
  imports: [CommonModule, FormsModule],
  templateUrl: './id-checker.html',
  styleUrl: './id-checker.scss'
})
export class IdChecker {
  searchId: string = '';
  character: Character | null = null;
  notFound: boolean = false;
  searched: boolean = false;
  splitTwinsMode: boolean = false;

  constructor(private characterService: CharacterService) {}

  searchById() {
    const id = parseInt(this.searchId);
    
    if (isNaN(id)) {
      this.notFound = true;
      this.character = null;
      this.searched = true;
      return;
    }

    // IDs that should use non-split twins mode
    const nonSplitTwinsIds = [43, 96];
    // IDs that should use split twins mode
    const splitTwinsIds = [44, 45, 53, 97, 98];

    this.searchInCurrentMode(id, (found) => {
      if (!found) {
        // Character not found, check if we should auto-switch modes
        if (splitTwinsIds.includes(id) && !this.splitTwinsMode) {
          // Switch to split twins mode and try again
          this.splitTwinsMode = true;
          this.searchInCurrentMode(id);
        } else if (nonSplitTwinsIds.includes(id) && this.splitTwinsMode) {
          // Switch to non-split twins mode and try again
          this.splitTwinsMode = false;
          this.searchInCurrentMode(id);
        } else {
          // No auto-switch needed, character truly not found
          this.character = null;
          this.notFound = true;
          this.searched = true;
        }
      }
    });
  }

  private searchInCurrentMode(id: number, callback?: (found: boolean) => void) {
    if (this.splitTwinsMode) {
      this.characterService.getCharactersSplitTwins(true).subscribe((characters) => {
        const char = characters.find(c => c.id === id);
        if (char) {
          this.character = char;
          this.notFound = false;
          this.searched = true;
          if (callback) callback(true);
        } else {
          if (callback) {
            callback(false);
          } else {
            this.character = null;
            this.notFound = true;
            this.searched = true;
          }
        }
      });
    } else {
      this.characterService.getCharacter(id).subscribe((char) => {
        if (char) {
          this.character = char;
          this.notFound = false;
          this.searched = true;
          if (callback) callback(true);
        } else {
          if (callback) {
            callback(false);
          } else {
            this.character = null;
            this.notFound = true;
            this.searched = true;
          }
        }
      });
    }
  }

  clearSearch() {
    this.searchId = '';
    this.character = null;
    this.notFound = false;
    this.searched = false;
  }

  onInputChange() {
    this.searched = false;
    this.notFound = false;
  }

  onEnter(event: Event) {
    event.preventDefault();
    this.searchById();
  }
}
