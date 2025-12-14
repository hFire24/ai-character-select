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
  @Input() showMore = false;
  @Input() showRetired = false;
  @Input() searchTerm = '';
  characters: Character[] = [];

  constructor(private characterService: CharacterService) {
    this.characterService.getCharactersPlusCriticizer().subscribe(data => {
      this.characters = data;
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
    
    // If user is actively searching, disable filters and search across all characters
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      baseCharacters = this.characters.filter(character => 
        character.shortName.toLowerCase().includes(searchLower) ||
        character.name.toLowerCase().includes(searchLower)
      );
    } else {
      // Apply normal filters when not searching
      if (!this.showMore && !this.showRetired) {
        baseCharacters = this.characters.filter(c => c.tier <= 4 && !c.type.includes('inactive'));
      } else if (!this.showMore && this.showRetired) {
        baseCharacters = this.characters.filter(c => c.tier <= 4);
      } else if(!this.showRetired) {
        baseCharacters = this.characters.filter(c => c.tier > 4 && !c.type.includes('retired') && !c.type.includes('inactive'));
      } else {
        baseCharacters = this.characters.filter(c => c.tier > 4);
      }
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
