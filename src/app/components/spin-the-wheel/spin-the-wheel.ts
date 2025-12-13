import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterService, Character } from '../../services/character.service';
import { CharacterModal } from '../character-modal/character-modal';
import { Router } from '@angular/router';

@Component({
  selector: 'app-spin-the-wheel',
  templateUrl: './spin-the-wheel.html',
  styleUrl: './spin-the-wheel.scss',
  imports: [CommonModule, FormsModule, CharacterModal],
  standalone: true
})
export class SpinTheWheel {
  spotlightIndex: number | null = null;
  characters: Character[] = [];
  filteredCharacters: Character[] = [];
  excludedCharacters: Character[] = [];
  selectedFilter: string = 'all';
  spinning = false;
  selectedCharacter: Character | null = null;
  showCard = false;

  constructor(
    private characterService: CharacterService,
    private router: Router
  ) {}

  ngOnInit() {
    this.characterService.getCharacters().subscribe(chars => {
      this.characters = chars;
      this.applyFilter();
    });
  }

  ngOnChanges() {
    this.applyFilter();
  }

  ngDoCheck() {
    this.applyFilter();
  }

  applyFilter() {
    switch (this.selectedFilter) {
      case 'tier1':
        this.filteredCharacters = this.characters.filter(c => c.tier <= 3);
        break;
      case 'tier3':
        this.filteredCharacters = this.characters.filter(c => c.tier <= 4);
        break;
      case 'active-retired':
        this.filteredCharacters = this.characters.filter(c => ['active', 'retired', 'inactive'].includes(c.type));
        break;
      default:
        this.filteredCharacters = this.characters.filter(c => c.type !== 'me');
    }
  }

  disable(character: Character) {
    if (this.spinning) return;
    const index = this.excludedCharacters.findIndex(c => c === character);
    if (index !== -1) {
      this.excludedCharacters.splice(index, 1);
    } else {
      this.excludedCharacters.push(character);
    }
  }

  spinWheel() {
    const availableCharacters = this.filteredCharacters.filter(char => !this.excludedCharacters.includes(char));
    if (this.spinning) return;
    if (availableCharacters.length === 0) {
      alert('Silly goose! You disabled all the characters! You need to enable at least one character to spin.');
      return;
    }
    if (availableCharacters.length === 1) {
      this.selectedCharacter = availableCharacters[0];
      return;
    }
    this.spinning = true;
    this.selectedCharacter = null;
    this.spotlightIndex = null;
    const total = availableCharacters.length;
    const rounds = 12; // how many spotlights before stopping
    let current = 0;
    let interval = 120;
    const indices: number[] = [];
    for (let i = 0; i < rounds; i++) {
      indices.push(Math.floor(Math.random() * total));
    }
    // Final index to select
    const finalIndex = Math.floor(Math.random() * total);
    indices.push(finalIndex);

    const spotlightStep = () => {
      if (current < indices.length) {
        const availableIndex = indices[current];
        const selectedChar = availableCharacters[availableIndex];
        this.spotlightIndex = this.filteredCharacters.findIndex(char => char === selectedChar);
        current++;
        interval = Math.min(300, interval + 20); // slow down
        setTimeout(spotlightStep, interval);
      } else {
        this.selectedCharacter = availableCharacters[finalIndex];
        this.spotlightIndex = null;
        this.spinning = false;
      }
    };
    spotlightStep();
  }

  getChatLink(character: Character): string {
    const key = 'chatLink_' + (character.name || 'unknown');
    const stored = localStorage.getItem(key);
    return stored ? stored : character.link;
  }

  goBackToRoster() {
    this.router.navigate(['/']);
  }
}
