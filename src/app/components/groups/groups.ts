import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterModal } from '../character-modal/character-modal';
import { BackButton } from '../back-button/back-button';
import { CharacterService, Character } from '../../services/character.service';

interface Group {
  id: number;
  name: string;
  description?: string;
  characters: Character[];
}

@Component({
  selector: 'app-groups',
  imports: [CommonModule, CharacterModal, BackButton],
  templateUrl: './groups.html',
  styleUrls: ['./groups.scss']
})
export class Groups implements OnInit {
  groups: Group[] = [];
  characters: Character[] = [];
  loading = true;
  selectedCharacter: Character | null = null;

  constructor(
    private characterService: CharacterService
  ) {}

  ngOnInit() {
    this.characterService.getCharactersPlusCriticizer().subscribe(chars => {
      this.characters = chars;
      this.initializeGroups();
      this.loading = false;
    });
  }

  private initializeGroups() {
    // Define groups with character IDs
    const groupDefinitions = [
      {
        name: "Music Enjoyers",
        description: "The official group of Music Enjoyers, based on my own music tastes and playlists.",
        characterIds: [11, 1, 2, 3, 4, 6, 7, 8, 9, 12, 10]
      },
      {
        name: "Retired Six",
        description: "Six of the earliest retired characters who will never get unretired.",
        characterIds: [16, 17, 19, 20, 22, 23]
      },
      {
        name: "Corey's Party",
        description: "Corey and his party members who go on adventures together.",
        characterIds: [73, 20, 38, 39, 40]
      },
      {
        name: "Anti-Escapists",
        description: "A group of characters who embody the opposite of escapism.",
        characterIds: [36, 78, 52, 9, 48, 50]
      },
      {
        name: "Anti-Moe Crew",
        description: "Chaotic or hedonistic characters who reject moe",
        characterIds: [1, 62, 63, 55, 83, 84, 12, 32, 64, 18]
      }
    ];

    this.groups = groupDefinitions.map((def, index) => ({
      id: index + 1,
      name: def.name,
      description: def.description,
      characters: def.characterIds
        .map(id => this.characters.find(c => c.id === id))
        .filter(c => c !== undefined) as Character[]
    }));
  }

  assetPath(path: string): string {
    return 'assets/' + path;
  }

  genClass(generation: number): string {
    return 'gen' + generation;
  }

  onCharacterClick(character: Character) {
    this.selectedCharacter = character; // Trigger modal display
  }
}