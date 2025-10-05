import { Component } from '@angular/core';
import { CharacterGrid } from "../character-grid/character-grid";
import { HeaderButtons } from '../header-buttons/header-buttons';
import { CharacterModal } from '../character-modal/character-modal';
import { MoodModal } from '../mood-modal/mood-modal';
import { FooterButtons } from '../footer-buttons/footer-buttons';
import { CommonModule } from '@angular/common';
import { Character } from '../../services/character.service';
import { Mood } from '../../services/mood.service';

@Component({
  selector: 'app-roster',
  imports: [CharacterGrid, HeaderButtons, CharacterModal, MoodModal, FooterButtons, CommonModule],
  templateUrl: 'roster.html',
  styleUrl: 'roster.scss'
})
export class Roster {
  showMoreCharacters = false;
  selectedCharacter: Character | null = null;
  selectedMood: Mood | null = null;
  showRetiredCharacters = false;

  toggleCharacters() {
    this.showMoreCharacters = !this.showMoreCharacters;
    window.scrollTo({ top: 0 });
  }

  toggleRetiredCharacters() {
    this.showRetiredCharacters = !this.showRetiredCharacters;
  }

  displayCharacter() {
    this.selectedCharacter = this.selectedCharacter; // Trigger modal display
  }

  openTierList() {
    // Logic to open the tier list modal
  }
}
