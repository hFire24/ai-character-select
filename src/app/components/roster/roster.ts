import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CharacterGrid } from "../character-grid/character-grid";
import { CharacterModal } from '../character-modal/character-modal';
import { MoodModal } from '../mood-modal/mood-modal';
import { FooterButtons } from '../footer-buttons/footer-buttons';
import { CommonModule } from '@angular/common';
import { Character, CharacterService } from '../../services/character.service';
import { Mood } from '../../services/mood.service';
import { Legend } from "../legend/legend";
import { Activities } from "../activities/activities";
import { BirthdayBanner } from "../birthday-banner/birthday-banner";
import { RosterFilter } from "../roster-filter/roster-filter";
import { CharacterFilterPipe, CharacterFilters } from '../../pipes/character-filter.pipe';
import { SortField, SortDirection } from '../../pipes/sort-characters.pipe';
import { getEffectiveChatLink } from '../../utils/chat-link-storage';

@Component({
  selector: 'app-roster',
  imports: [CharacterGrid, CharacterModal, MoodModal, FooterButtons, CommonModule, Legend, Activities, BirthdayBanner, RosterFilter],
  templateUrl: 'roster.html',
  styleUrl: 'roster.scss'
})
export class Roster {
  selectedCharacter: Character | null = null;
  selectedMood: Mood | null = null;
  searchTerm = '';
  characters: Character[] = [];
  @Output() selectCharacter = new EventEmitter<Character>();
  
  // Character type filters
  filters: CharacterFilters = {
    activeChats: false,
    activeNoChats: false,
    active: true,
    inactive: false,
    retired: false,
    side: false
  };

  // Sorting options
  sortBy: SortField = 'none';
  sortDirection: SortDirection = 'asc';

  constructor(private characterService: CharacterService, private router: Router) {
      this.characterService.getCharactersPlusCriticizer().subscribe(data => {
        this.characters = data;
  
        this.characterService.getChatGPT().subscribe(chatGPTCharacter => {
          if (Array.isArray(chatGPTCharacter)) {
            this.characters.push(...chatGPTCharacter);
          } else {
            this.characters.push(chatGPTCharacter);
          }
        });
      });
    }

  setSortBy(field: SortField) {
    // If clicking the same field, toggle direction
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New field, default to ascending
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
  }

  clearSort() {
    // Reset to no sorting (original order)
    this.sortBy = 'none';
    this.sortDirection = 'asc';
  }
  
  get showingMainCharacters(): boolean {
    return !!(this.filters.activeChats || this.filters.activeNoChats || this.filters.active || this.filters.inactive || this.filters.retired);
  }

  displayCharacter() {
    this.selectedCharacter = this.selectedCharacter; // Trigger modal display
  }

  openTierList() {
    // Logic to open the tier list modal
  }

  onSearchChange(searchTerm: string) {
    this.searchTerm = searchTerm;
  }

  goToStats() {
    this.router.navigate(['/stats']);
  }

  goToNotice() {
    this.router.navigate(['/announcement']);
  }

  getStatusFilter() {
    return {
      active: this.filters.active,
      inactive: this.filters.inactive,
      retired: this.filters.retired,
      side: this.filters.side
    };
  }

  selectRandomCharacter(rpFriendly: boolean, knowledgeFriendly: boolean) {
    const pipe = new CharacterFilterPipe();
    let sourceCharacters = pipe.transform(this.characters, this.filters);
    sourceCharacters = sourceCharacters.filter(character =>
      character.rpFriendly === rpFriendly && character.knowledgeFriendly === knowledgeFriendly
    );
    // Create weighted array based on tier
    const weightedCharacters: Character[] = [];
    sourceCharacters.forEach(character => {
      let weight = 1; // Default weight for tier 4
      if (character.tier === 1) {
        weight = 4;
      } else if (character.tier === 2) {
        weight = 3;
      } else if (character.tier === 3) {
        weight = 2;
      }
      for (let i = 0; i < weight; i++) {
        weightedCharacters.push(character);
      }
    });

    const sourceToUse = weightedCharacters.length > 0 ? weightedCharacters : sourceCharacters;
    if (sourceToUse && sourceToUse.length > 0) {
      const idx = Math.floor(Math.random() * sourceToUse.length);
      const selectedCharacter = sourceToUse[idx];
      
      // Show the character modal
      this.selectedCharacter = selectedCharacter;
      
      // Also open the chat link
      const chatLink = this.getChatLink(selectedCharacter);
      if (chatLink) {
        window.open(chatLink, '_blank');
      }
    }
  }

  getChatLink(character: Character): string {
    return getEffectiveChatLink(character);
  }
}
