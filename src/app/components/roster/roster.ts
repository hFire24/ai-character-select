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
import { CharacterFilters } from '../../pipes/character-filter.pipe';
import { SortField, SortDirection } from '../../pipes/sort-characters.pipe';

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
  filters: CharacterFilters = {
    active: true,
    inactive: false,
    retired: false,
    side: false
  };

  // Sorting options
  sortBy: SortField = 'none';
  sortDirection: SortDirection = 'asc';

  constructor(private router: Router) {}

  toggleFilter(filterType: 'active' | 'inactive' | 'retired' | 'side') {
    // Create a new object to trigger pipe change detection
    const newFilters = { ...this.filters };
    newFilters[filterType] = !newFilters[filterType];
    
    // Ensure at least one filter is always active
    const hasActiveFilter = Object.values(newFilters).some(v => v);
    if (!hasActiveFilter) {
      newFilters[filterType] = true;
    }
    
    // Assign the new object reference
    this.filters = newFilters;
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
