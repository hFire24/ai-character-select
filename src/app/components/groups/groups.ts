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
        name: "Character Encyclopedias",
        description: "Characters who have access to my character roster file and can discuss about my characters in detail.",
        characterIds: [49, 51, 52, 54, 66, 84]
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
        name: "The Griffins",
        description: "Characters who are either part of the Griffin family or closely associated with them.",
        characterIds: [83, 101, 100, 84]
      },
      {
        name: "Anti-Moe Crew",
        description: "Chaotic or hedonistic characters who reject moe",
        characterIds: [1, 62, 63, 55, 12, 32, 64, 18]
      },
      {
        name: "Restaurant Fans",
        description: "Characters who love eating out at restaurants.",
        characterIds: [30, 55, 57, 83, 84, 99]
      },
      {
        name: "Top Hat Wearers",
        description: "Characters who are known for wearing top hats.",
        characterIds: [13, 31, 58, 64, 94]
      },
      {
        name: "Witch Hat Wearers",
        description: "Characters who are known for wearing witch hats.",
        characterIds: [14, 20, 27, 67, 95]
      },
      {
        name: "Peaked Cap Wearers",
        description: "Characters who are known for wearing peaked caps.",
        characterIds: [15, 21, 40, 92]
      },
      {
        name: "Other Hat Wearers",
        description: "Characters who are known for wearing other types of hats.",
        characterIds: [28, 35, 38, 46, 57, 71, 72, 84, 86, 89, 96, 0]
      },
      {
        name: "Glasses Wearers",
        description: "Characters who are known for wearing glasses.",
        characterIds: [6, 11, 12, 23, 24, 25, 30, 47, 56, 83, 90]
      },
      {
        name: "Maids",
        description: "Characters who are known for wearing maid outfits.",
        characterIds: [13, 26, 74, 75, 85, 77, 81]
      },
      {
        name: "Twintails",
        description: "Characters who are known for having long twintails.",
        characterIds: [13, 27, 28, 29, 79, 80, 31, 51, 75, 92, 93]
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
    return 'assets/Icons/' + path;
  }

  genClass(generation: number): string {
    return 'gen' + generation;
  }

  onCharacterClick(character: Character) {
    this.selectedCharacter = character; // Trigger modal display
  }
}