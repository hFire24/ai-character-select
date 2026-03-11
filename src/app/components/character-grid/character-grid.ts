import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService, Character } from '../../services/character.service';

@Component({
  selector: 'app-character-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-grid.html',
  styleUrl: './character-grid.scss'
})
export class CharacterGrid {
  @Input() filters = {
    active: true,
    inactive: false,
    retired: false,
    side: false
  };
  @Input() searchTerm = '';
  characters: Character[] = [];

  constructor(private characterService: CharacterService) {
    this.characterService.getCharactersPlusCriticizer().subscribe(data => {
      this.characters = data;
      
      this.characterService.getChatGPT().subscribe(chatGPTCharacter => {
        if (Array.isArray(chatGPTCharacter)) {
          this.characters.push(...chatGPTCharacter);
        } else {
          this.characters.push(chatGPTCharacter);
        }
      });
      
      // Preload all character images
      this.characters.forEach(character => {
        if (character.img) {
          const img = new Image();
          img.src = this.assetPath(character.img);
        }
      });
    });
  }

  get filteredCharacters(): Character[] {
    let baseCharacters: Character[];
    
    // If user is actively searching, show all characters matching the search
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      baseCharacters = this.characters.filter(character => 
        character.shortName.toLowerCase().includes(searchLower) ||
        character.name.toLowerCase().includes(searchLower)
      );
    } else {
      // Apply filters based on character status (active, inactive, retired, side)
      baseCharacters = this.characters.filter(character => {
        // Check if character's status matches any active filter
        if (character.status === 'active' && this.filters.active) return true;
        if (character.status === 'inactive' && this.filters.inactive) return true;
        if (character.status === 'retired' && this.filters.retired) return true;
        
        // Side characters are those that don't have active, inactive, or retired status, but are still considered part of the character roster
        const isMainCharacter = ['active', 'inactive', 'retired'].includes(character.status);
        if (!isMainCharacter && this.filters.side) return true;
        
        return false;
      });
    }

    return baseCharacters;
  }

  genClass(g: number) {
    return 'gen' + g;
  }

  assetPath(path: string) {
    return 'assets/' + path;
  }

  @Output() selectCharacter = new EventEmitter<Character>();
}
