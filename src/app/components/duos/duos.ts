import { Component, OnInit } from '@angular/core';
import { Character, DuoPair } from '../../services/character.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../services/character.service';
import { CharacterModal } from '../character-modal/character-modal';
import { BackButton } from '../back-button/back-button';

@Component({
  selector: 'app-duos',
  imports: [CommonModule, FormsModule, CharacterModal, BackButton],
  templateUrl: './duos.html',
  styleUrl: './duos.scss'
})
export class Duos implements OnInit {
  character1: Character | null = null;
  character2: Character | null = null;
  character1Input: string = '';
  character2Input: string = '';
  duoName: string = '';
  selectedCharacter: Character | null = null;
  
  // Form fields for adding new duo
  newDuoName: string = '';
  newDuoAltName: string = '';
  
  allCharacters: Character[] = [];
  filteredCharacters1: Character[] = [];
  filteredCharacters2: Character[] = [];
  showSuggestions1: boolean = false;
  showSuggestions2: boolean = false;
  
  // Check if running in development mode
  isDevelopment: boolean = false;
  
  // Store original twin characters for modal display
  private liamKieranOriginal: Character | null = null;
  private ririRuruOriginal: Character | null = null;

  // Duo name pairs - loaded dynamically
  duoPairs: DuoPair[] = [];

  constructor(private characterService: CharacterService) {
    this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  ngOnInit() {
    // Load characters
    this.characterService.getCharactersSplitTwins().subscribe(characters => {
      this.allCharacters = characters;
    });

    // Load duos
    this.loadDuos();
  }

  loadDuos() {
    this.characterService.getDuos().subscribe(duos => {
      this.duoPairs = duos;
    });
  }

  onInput1Change() {
    if (this.character1Input.length > 0) {
      this.filteredCharacters1 = this.allCharacters.filter(c => 
        c.name.toLowerCase().includes(this.character1Input.toLowerCase()) ||
        c.shortName.toLowerCase().includes(this.character1Input.toLowerCase())
      );
      this.showSuggestions1 = this.filteredCharacters1.length > 0;
    } else {
      this.showSuggestions1 = false;
    }
    // Clear character1 if input doesn't match
    if (!this.character1 || this.character1.name !== this.character1Input) {
      this.character1 = null;
    }
  }

  onInput2Change() {
    if (this.character2Input.length > 0) {
      this.filteredCharacters2 = this.allCharacters.filter(c => 
        c.name.toLowerCase().includes(this.character2Input.toLowerCase()) ||
        c.shortName.toLowerCase().includes(this.character2Input.toLowerCase())
      );
      this.showSuggestions2 = this.filteredCharacters2.length > 0;
    } else {
      this.showSuggestions2 = false;
    }
    // Clear character2 if input doesn't match
    if (!this.character2 || this.character2.name !== this.character2Input) {
      this.character2 = null;
    }
  }

  selectCharacter1(character: Character) {
    this.character1 = character;
    this.character1Input = character.name;
    this.showSuggestions1 = false;
    this.generateDuoName();
  }

  selectCharacter2(character: Character) {
    this.character2 = character;
    this.character2Input = character.name;
    this.showSuggestions2 = false;
    this.generateDuoName();
  }

  generateDuoName() {
    if (this.character1 && this.character2) {
      // Sort IDs to ensure consistent lookup regardless of selection order
      const [id1, id2] = [this.character1.id, this.character2.id].sort((a, b) => a - b);
      
      // Look for a custom duo name
      const customDuo = this.duoPairs.find(duo => 
        duo.id1 === id1 && duo.id2 === id2
      );
      
      // Use custom name if found, otherwise use default format (Character1 & Character2)
      this.duoName = customDuo 
        ? (this.character1.id > this.character2.id && customDuo.altName ? customDuo.altName : customDuo.name)
        : `${this.character1.name} & ${this.character2.name}`;
    }
  }

  hasCustomDuoName(): boolean {
    if (!this.character1 || !this.character2) return false;
    const [id1, id2] = [this.character1.id, this.character2.id].sort((a, b) => a - b);
    return this.duoPairs.some(duo => duo.id1 === id1 && duo.id2 === id2);
  }

  genClass(g: number) {
    return 'gen' + g;
  }

  assetPath(path: string) {
    return 'assets/' + path;
  }

  openCharacterModal(character: Character) {
    // If clicking on a split twin, show the original twin's profile
    if ((character as any).isTwinSplit) {
      // Determine which original twin to show based on the character's ID
      if (character.id === 44 || character.id === 45) {
        this.selectedCharacter = this.liamKieranOriginal;
      } else if (character.id === 52 || character.id === 53) {
        this.selectedCharacter = this.ririRuruOriginal;
      }
    } else {
      this.selectedCharacter = character;
    }
  }

  submitNewDuo() {
    if (!this.character1 || !this.character2) {
      alert('Please select both characters.');
      return;
    }

    if (!this.newDuoName.trim()) {
      alert('Please enter a duo name.');
      return;
    }

    // Sort IDs to ensure consistency
    const [id1, id2] = [this.character1.id, this.character2.id].sort((a, b) => a - b);

    const newDuo: DuoPair = {
      id1,
      id2,
      name: this.newDuoName.trim(),
      ...(this.newDuoAltName.trim() && { altName: this.newDuoAltName.trim() })
    };

    this.characterService.addDuo(newDuo).subscribe({
      next: (updatedDuos) => {
        this.duoPairs = updatedDuos;
        this.generateDuoName(); // Refresh the duo name
        alert('Duo added successfully!');
        this.clearNewDuoForm();
      },
      error: (err) => {
        alert(err.message || 'Failed to add duo.');
      }
    });
  }

  clearNewDuoForm() {
    this.newDuoName = '';
    this.newDuoAltName = '';
  }

  getRandomDuo(type: 'named' | 'unnamed') {
    if (type === 'named') {
      // Select a random existing duo
      if (this.duoPairs.length === 0) {
      alert('No named duos available.');
      return;
      }
      const randomDuo = this.duoPairs[Math.floor(Math.random() * this.duoPairs.length)];
      
      // Find the characters by ID
      this.character1 = this.allCharacters.find(c => c.id === randomDuo.id1) || null;
      this.character2 = this.allCharacters.find(c => c.id === randomDuo.id2) || null;
      
      if (this.character1 && this.character2) {
      this.character1Input = this.character1.name;
      this.character2Input = this.character2.name;
      this.generateDuoName();
      }
    } else {
      // Select two random characters without an existing duo
      let attempts = 0;
      const maxAttempts = (this.allCharacters.length * (this.allCharacters.length - 1));
      
      while (attempts < maxAttempts) {
      const char1 = this.allCharacters[Math.floor(Math.random() * this.allCharacters.length)];
      const char2 = this.allCharacters[Math.floor(Math.random() * this.allCharacters.length)];
      
      // Ensure different characters
      if (char1.id === char2.id) {
        attempts++;
        continue;
      }
      
      // Check if duo already exists
      const [id1, id2] = [char1.id, char2.id].sort((a, b) => a - b);
      const hasDuo = this.duoPairs.some(duo => duo.id1 === id1 && duo.id2 === id2);
      
      if (!hasDuo) {
        this.character1 = char1;
        this.character2 = char2;
        this.character1Input = char1.name;
        this.character2Input = char2.name;
        this.generateDuoName();
        return;
      }
      
      attempts++;
      }
      
      alert('Could not find an unnamed duo pair.');
    }
  }
}