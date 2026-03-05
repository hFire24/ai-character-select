import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CharacterGrid } from "../character-grid/character-grid";
import { CharacterModal } from '../character-modal/character-modal';
import { MoodModal } from '../mood-modal/mood-modal';
import { FooterButtons } from '../footer-buttons/footer-buttons';
import { CommonModule } from '@angular/common';
import { Character } from '../../services/character.service';
import { Mood } from '../../services/mood.service';
import { Legend } from "../legend/legend";
import { SearchBar } from "../search-bar/search-bar";
import { Activities } from "../activities/activities";
import { BirthdayBanner } from "../birthday-banner/birthday-banner";

@Component({
  selector: 'app-roster',
  imports: [CharacterGrid, CharacterModal, MoodModal, FooterButtons, CommonModule, Legend, SearchBar, Activities, BirthdayBanner],
  templateUrl: 'roster.html',
  styleUrl: 'roster.scss'
})
export class Roster {
  selectedCharacter: Character | null = null;
  selectedMood: Mood | null = null;
  searchTerm = '';
  
  // Character type filters
  filters = {
    active: true,
    inactive: false,
    retired: false,
    side: false
  };

  constructor(private router: Router) {}

  toggleFilter(filterType: 'active' | 'inactive' | 'retired' | 'side') {
    this.filters[filterType] = !this.filters[filterType];
    
    // Ensure at least one filter is always active
    const hasActiveFilter = Object.values(this.filters).some(v => v);
    if (!hasActiveFilter) {
      this.filters[filterType] = true;
    }
  }
  
  get showingMainCharacters(): boolean {
    return this.filters.active || this.filters.inactive || this.filters.retired;
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
}
