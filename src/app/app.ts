import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from './services/character.service';
import { Mood } from './services/mood.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
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

  openTierList() {
    // Logic to open the tier list modal
  }
}
