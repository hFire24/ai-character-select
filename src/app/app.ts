import { Component } from '@angular/core';
import { CharacterGrid } from "./components/character-grid/character-grid";
import { HeaderButtons } from './components/header-buttons/header-buttons';
import { CharacterModal } from './components/character-modal/character-modal';
import { MoodModal } from './components/mood-modal/mood-modal';
import { FooterButtons } from './components/footer-buttons/footer-buttons';
import { CommonModule } from '@angular/common';
import { Character } from './services/character.service';
import { Mood } from './services/mood.service';

@Component({
  selector: 'app-root',
  imports: [CharacterGrid, HeaderButtons, CharacterModal, MoodModal, FooterButtons, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  showMoreCharacters = false;
  selectedCharacter: Character | null = null;
  selectedMood: Mood | null = null;

  toggleCharacters() {
    this.showMoreCharacters = !this.showMoreCharacters;
    window.scrollTo({ top: 0 });
  }

  displayCharacter() {
    this.selectedCharacter = this.selectedCharacter; // Trigger modal display
  }
}
