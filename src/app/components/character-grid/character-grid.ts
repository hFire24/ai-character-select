import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService, Character } from '../../services/character.service';
import { CharacterFilterPipe, CharacterFilters } from '../../pipes/character-filter.pipe';
import { SortCharactersPipe, SortField, SortDirection } from '../../pipes/sort-characters.pipe';

@Component({
  selector: 'app-character-grid',
  standalone: true,
  imports: [CommonModule, CharacterFilterPipe, SortCharactersPipe],
  templateUrl: './character-grid.html',
  styleUrl: './character-grid.scss'
})
export class CharacterGrid {
  @Input() filters: CharacterFilters = {
    activeChats: true,
    active: true,
    inactive: false,
    retired: false,
    side: false
  };
  @Input() searchTerm = '';
  @Input() sortBy: SortField = 'none';
  @Input() sortDirection: SortDirection = 'asc';
  
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

  genClass(g: number) {
    return 'gen' + g;
  }

  assetPath(path: string) {
    return 'assets/Icons/' + path;
  }

  @Output() selectCharacter = new EventEmitter<Character>();
}
