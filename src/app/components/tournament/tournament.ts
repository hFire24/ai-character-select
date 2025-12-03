import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TournamentBracket } from '../tournament-bracket/tournament-bracket';
import { BackButton } from '../back-button/back-button';
import { Character, CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-tournament',
  imports: [FormsModule, CommonModule, TournamentBracket, BackButton],
  templateUrl: './tournament.html',
  styleUrl: './tournament.scss'
})
export class Tournament implements OnInit {
  numPlayers: number = 8;
  tournamentCreated: boolean = false;
  tournamentName: string = 'Tournament';
  showEliminationStep: boolean = false;
  excludedCharacterIds: number[] = [32, 50];
  eliminationMethod: 'default' | 'manual' | 'random' = 'default';
  tier7Characters: Character[] = [];
  selectedCharacter1: Character | null = null;
  selectedCharacter2: Character | null = null;

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    this.characterService.getCharacters().subscribe(characters => {
      // Find the second-lowest tier (excluding highest tier)
      const tiers = [...new Set(characters.map(c => c.tier))].sort((a, b) => b - a);
      const secondLowestTier = tiers.length >= 2 ? tiers[1] : tiers[0];
      
      // Filter characters by second-lowest tier, plus always include IDs 32 and 50
      const char32 = characters.find(c => c.id === 32);
      const char50 = characters.find(c => c.id === 50);
      this.tier7Characters = characters.filter(c => c.tier === secondLowestTier);
      
      // Add IDs 32 and 50 if they're not already in the list
      if (char32 && !this.tier7Characters.find(c => c.id === 32)) {
        this.tier7Characters.push(char32);
      }
      if (char50 && !this.tier7Characters.find(c => c.id === 50)) {
        this.tier7Characters.push(char50);
      }
      
      // Set default selections to ?????????? and The Collapsed
      this.selectedCharacter1 = char32 || this.tier7Characters[0];
      this.selectedCharacter2 = char50 || this.tier7Characters[1];
      this.updateExcludedIds();
    });
  }

  createBracket() {
    if (+this.numPlayers === 64) {
      this.showEliminationStep = true;
    } else {
      this.tournamentCreated = true;
    }
  }

  selectEliminationMethod(method: 'default' | 'manual' | 'random') {
    this.eliminationMethod = method;
    if (method === 'random') {
      this.randomizeExclusions();
    } else if (method === 'default') {
      // Default always uses IDs 32 and 50 regardless of tier
      this.characterService.getCharacters().subscribe(characters => {
        this.selectedCharacter1 = characters.find(c => c.id === 32) || this.tier7Characters[0];
        this.selectedCharacter2 = characters.find(c => c.id === 50) || this.tier7Characters[1];
        this.updateExcludedIds();
      });
    }
  }

  updateExcludedIds() {
    this.excludedCharacterIds = [
      this.selectedCharacter1?.id || 32,
      this.selectedCharacter2?.id || 50
    ];
  }

  randomizeExclusions() {
    // Randomly select 2 characters from second-lowest tier (including IDs 32 & 50)
    const shuffled = [...this.tier7Characters].sort(() => Math.random() - 0.5);
    this.selectedCharacter1 = shuffled[0];
    this.selectedCharacter2 = shuffled[1];
    this.updateExcludedIds();
  }

  toggleCharacterSelection(char: Character) {
    // Only allow manual selection in manual mode
    if (this.eliminationMethod !== 'manual') {
      return;
    }

    // Check if character is already selected
    if (this.selectedCharacter1?.id === char.id) {
      this.selectedCharacter1 = null;
    } else if (this.selectedCharacter2?.id === char.id) {
      this.selectedCharacter2 = null;
    } else {
      // Add to first available slot
      if (!this.selectedCharacter1) {
        this.selectedCharacter1 = char;
      } else if (!this.selectedCharacter2) {
        this.selectedCharacter2 = char;
      } else {
        // Both slots full, replace the first one
        this.selectedCharacter1 = char;
      }
    }
    this.updateExcludedIds();
  }

  isCharacterSelected(char: Character): boolean {
    return this.selectedCharacter1?.id === char.id || this.selectedCharacter2?.id === char.id;
  }

  getSelectedCount(): number {
    return (this.selectedCharacter1 ? 1 : 0) + (this.selectedCharacter2 ? 1 : 0);
  }

  confirmEliminations() {
    if (this.getSelectedCount() !== 2) {
      alert('Please select exactly 2 characters to eliminate.');
      return;
    }
    this.showEliminationStep = false;
    this.tournamentCreated = true;
  }

  backToElimination() {
    this.showEliminationStep = true;
    this.tournamentCreated = false;
  }
}
