import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CharacterService, Character } from '../../services/character.service';
import { CommonModule } from '@angular/common';
import { TierScreenshot } from '../tier-screenshot/tier-screenshot';
import { BackButton } from '../back-button/back-button';

@Component({
  selector: 'app-blind-ranking',
  imports: [FormsModule, CommonModule, TierScreenshot, BackButton],
  templateUrl: './blind-ranking.html',
  styleUrl: './blind-ranking.scss'
})
export class BlindRanking {
  title: string = "Blind Ranking";
  rankingStarted: boolean = false;
  allCharacters: Character[] = [];
  availableCharacters: Character[] = [];
  currentCharacter: Character | null = null;
  rankedCharacters: (Character | null)[] = [null, null, null, null, null];
  temporaryPlacement: number | null = null; // Track which slot is temporarily filled
  gameComplete: boolean = false;
  screenshotDataUrl: string | null = null;
  
  private characterService = inject(CharacterService);

  constructor() {
    this.characterService.getCharactersSplitTwins().subscribe((characters: Character[]) => {
      this.allCharacters = characters.filter(c => c.name !== 'Future Sapphire');
    });
  }

  startRanking() {
    console.log("Ranking started with title:", this.title);
    this.rankingStarted = true;
    this.resetGame();
    this.showNextCharacter();
  }

  private resetGame() {
    this.availableCharacters = [...this.allCharacters];
    this.shuffleArray(this.availableCharacters);
    this.rankedCharacters = [null, null, null, null, null];
    this.currentCharacter = null;
    this.temporaryPlacement = null;
    this.gameComplete = false;
  }

  private shuffleArray(array: Character[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private showNextCharacter() {
    if (this.availableCharacters.length > 0) {
      this.currentCharacter = this.availableCharacters.pop()!;
      this.temporaryPlacement = null;
    }
  }

  placeInRank(rankIndex: number) {
    if (!this.currentCharacter || this.rankedCharacters[rankIndex] !== null) {
      return;
    }

    // Remove from previous temporary placement if exists
    if (this.temporaryPlacement !== null) {
      this.rankedCharacters[this.temporaryPlacement] = null;
    }

    // Place in new rank temporarily
    this.rankedCharacters[rankIndex] = this.currentCharacter;
    this.temporaryPlacement = rankIndex;
  }

  nextCharacter() {
    if (this.temporaryPlacement === null) {
      return;
    }

    // Lock in the current placement
    this.temporaryPlacement = null;

    const filledCount = this.rankedCharacters.filter(c => c !== null).length;
    
    // If 4th character was just placed, show the 5th character and auto-place it
    if (filledCount === 4) {
      this.showAndAutoPlaceLastCharacter();
      return;
    }

    if (filledCount >= 5) {
      this.gameComplete = true;
      return;
    }

    this.showNextCharacter();
  }

  private showAndAutoPlaceLastCharacter() {
    // Just show the 5th character, let the user place it manually
    this.showNextCharacter();
  }

  playAgain() {
    this.rankingStarted = false;
    this.resetGame();
  }

  isTemporaryPlacement(index: number): boolean {
    return this.temporaryPlacement === index;
  }

  async takeScreenshot() {
    // Dynamically import html2canvas
    const html2canvas = (await import('html2canvas')).default;
    const screenshotArea = document.querySelector('.screenshot-area') as HTMLElement;
    if (!screenshotArea) return;

    // Hide buttons before taking screenshot
    const buttonsEls = document.querySelectorAll('.screenshot-buttons') as NodeListOf<HTMLElement>;
    const prevDisplays: string[] = [];
    buttonsEls.forEach(el => {
      prevDisplays.push(el.style.display);
      el.style.display = 'none';
    });

    // Detect color scheme preference
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const backgroundColor = isDarkMode ? '#181a1b' : '#f0f0f0';

    const canvas = await html2canvas(screenshotArea, { 
      backgroundColor: backgroundColor,
      scale: 1 // Standard quality
    });

    // Restore buttons
    buttonsEls.forEach((el, i) => {
      el.style.display = prevDisplays[i] ?? '';
    });

    this.screenshotDataUrl = canvas.toDataURL('image/png');
  }
}
