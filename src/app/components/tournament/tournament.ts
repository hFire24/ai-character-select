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
  eliminationMethod: 'manual' | 'random' = 'random';
  includedCharacterIds: number[] = [];
  selectableCharacters: Character[] = [];
  selectedCharacter1: Character | null = null;
  selectedCharacter2: Character | null = null;
  private allCharacters: Character[] = [];

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    this.characterService.getCharactersSplitTwins().subscribe(characters => {
      this.allCharacters = characters;
      this.updateSelectableCharacters();
      this.selectedCharacter1 = null;
      this.selectedCharacter2 = null;
      this.updateIncludedIds();
      // Random is the default selection method
      this.randomizeExclusions();
    });
  }

  createBracket() {
    if (+this.numPlayers === 32) {
      // Skip selection for 32-player tournaments - include all characters
      this.includedCharacterIds = [];
      this.showEliminationStep = false;
      this.tournamentCreated = true;
      return;
    }

    if (+this.numPlayers === 64) {
      this.updateSelectableCharacters();
      // If Random is the current mode, ensure we (re)pick now
      if (this.eliminationMethod === 'random') {
        this.randomizeExclusions();
      } else {
        // In manual mode, initialize with no selection
        this.selectedCharacter1 = null;
        this.selectedCharacter2 = null;
        this.updateIncludedIds();
      }
      this.showEliminationStep = true;
    } else {
      this.tournamentCreated = true;
    }
  }

  selectEliminationMethod(method: 'manual' | 'random') {
    this.eliminationMethod = method;
    if (method === 'random') {
      this.randomizeExclusions();
    }
  }

  updateIncludedIds() {
    const targetTier = this.getTargetTier();
    // When selecting tier 7, treat ID 50 as tier 7
    const isTierMember = (c: Character) => {
      if (targetTier === 7) {
        return c.tier === 7 || c.id === 50;
      }
      return c.tier === targetTier;
    };
    const tierIds = this.allCharacters.filter(isTierMember).map(c => c.id);
    const selected = [this.selectedCharacter1?.id, this.selectedCharacter2?.id].filter((id): id is number => typeof id === 'number');
    
    // For tier 6 (64 players): includedCharacterIds is actually used as EXCLUSION list by bracket
    // So we put only the selected character ID to exclude
    if (targetTier === 6) {
      this.includedCharacterIds = selected;
    } else {
      // For other tiers: select to INCLUDE (so exclude the unselected ones from that tier)
      this.includedCharacterIds = tierIds.filter(id => !selected.includes(id));
    }
  }

  randomizeExclusions() {
    const shuffled = [...this.selectableCharacters].sort(() => Math.random() - 0.5);
    this.selectedCharacter1 = shuffled[0];
    this.selectedCharacter2 = (+this.numPlayers === 64 || +this.numPlayers === 32) ? null : shuffled[1];
    this.updateIncludedIds();
  }

  toggleCharacterSelection(char: Character) {
    if (this.eliminationMethod !== 'manual') {
      return;
    }
    const maxSelections = (+this.numPlayers === 64 || +this.numPlayers === 32) ? 1 : 2;
    if (this.selectedCharacter1?.id === char.id) {
      this.selectedCharacter1 = null;
    } else if (this.selectedCharacter2?.id === char.id) {
      this.selectedCharacter2 = null;
    } else {
      if (!this.selectedCharacter1) {
        this.selectedCharacter1 = char;
      } else if (maxSelections === 2 && !this.selectedCharacter2) {
        this.selectedCharacter2 = char;
      } else {
        this.selectedCharacter1 = char;
        if (maxSelections === 1) {
          this.selectedCharacter2 = null;
        }
      }
    }
    this.updateIncludedIds();
  }

  isCharacterSelected(char: Character): boolean {
    return this.selectedCharacter1?.id === char.id || this.selectedCharacter2?.id === char.id;
  }

  getSelectedCount(): number {
    return (this.selectedCharacter1 ? 1 : 0) + (this.selectedCharacter2 ? 1 : 0);
  }

  getTotalCount(): number {
    return (+this.numPlayers === 64 || +this.numPlayers === 32) ? 1 : 2;
  }

  confirmEliminations() {
    const expected = (+this.numPlayers === 64 || +this.numPlayers === 32) ? 1 : 2;
    if (this.getSelectedCount() !== expected) {
      const action = +this.numPlayers === 64 ? 'exclude' : 'include';
      alert(`Please select exactly ${expected} character${expected === 1 ? '' : 's'} to ${action}.`);
      return;
    }
    this.showEliminationStep = false;
    this.tournamentCreated = true;
  }

  backToElimination() {
    this.showEliminationStep = true;
    this.tournamentCreated = false;
  }

  private getTargetTier(): number {
    return +this.numPlayers === 64 ? 6 : (+this.numPlayers === 32 ? 5 : 0);
  }

  private updateSelectableCharacters() {
    const targetTier = this.getTargetTier();
    if (targetTier === 0) {
      this.selectableCharacters = [];
      return;
    }
    // When selecting tier 7, treat ID 50 as tier 7
    if (targetTier === 7) {
      const tierMembers = this.allCharacters.filter(c => c.tier === 7 || c.id === 50);
      // De-duplicate in case 50 already have tier 7
      const seen = new Set<number>();
      this.selectableCharacters = tierMembers.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
    } else {
      this.selectableCharacters = this.allCharacters.filter(c => c.tier === targetTier);
    }
  }
}
