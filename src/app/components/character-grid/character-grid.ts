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
  characters: Character[] = [];

  constructor(private characterService: CharacterService) {
    this.characterService.getCharacters().subscribe(data => {
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
    if (!this.showMore) {
      return this.characters.filter(c => c.importance >= 6);
    } else if(!this.showRetired) {
      return this.characters.filter(c => c.importance <= 5 && !c.type.includes('retired') && !c.type.includes('inactive'));
    } else {
      return this.characters.filter(c => c.importance <= 5);
    }
  }

  genClass(g: number) {
    return 'gen' + g;
  }

  assetPath(path: string) {
    return 'assets/' + path;
  }

  @Output() selectCharacter = new EventEmitter<Character>();
}
