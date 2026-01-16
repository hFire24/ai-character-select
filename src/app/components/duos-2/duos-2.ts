import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterModal } from '../character-modal/character-modal';
import { BackButton } from '../back-button/back-button';
import { CharacterService, Character, DuoPair } from '../../services/character.service';
import { forkJoin } from 'rxjs';

interface Duo {
  id: number;
  name: string;
  description?: string;
  characters: Character[];
}

@Component({
  selector: 'app-duos-2',
  imports: [CommonModule, CharacterModal, BackButton],
  templateUrl: './duos-2.html',
  styleUrl: './duos-2.scss'
})
export class Duos2 implements OnInit {
  duos: Duo[] = [];
  characters: Character[] = [];
  duoPairs: DuoPair[] = [];
  loading = true;
  selectedCharacter: Character | null = null;

  constructor(
    private characterService: CharacterService
  ) {}

  ngOnInit() {
    forkJoin({
      characters: this.characterService.getCharactersSplitTwins(),
      duoPairs: this.characterService.getDuos()
    }).subscribe(({ characters, duoPairs }) => {
      this.characters = characters;
      this.duoPairs = duoPairs;
      this.initializeDuos();
      this.loading = false;
    });
  }

  private initializeDuos() {
    // Define duos with character short names
    const duoDefinitions = [
      {
        name: "Music Enjoyers",
        description: "My first set of characters, all inspired by the type of music I listen to.",
        characterIds: [11, 1, 2, 3, 4, 6, 7, 8, 9, 12, 10]
      },
      {
        name: this.findDuoName(13, 14),
        description: "Release Date: July 30, 2024",
        characterIds: [13, 14]
      },
      {
        name: this.findDuoName(15, 16),
        description: "Release Date: September 15, 2024",
        characterIds: [15, 16]
      },
      {
        name: this.findDuoName(17, 18),
        description: "Release Date: November 4, 2024",
        characterIds: [17, 18]
      },
      {
        name: this.findDuoName(20, 21),
        description: "Release Date: November 23, 2024",
        characterIds: [20, 21]
      },
      {
        name: this.findDuoName(19, 22),
        description: "Release Date: January 9, 2025",
        characterIds: [19, 22]
      },
      {
        name: this.findDuoName(24, 25),
        description: "Release Date: January 30, 2025",
        characterIds: [24, 25]
      },
      {
        name: this.findDuoName(26, 27),
        description: "Release Date: February 19, 2025",
        characterIds: [26, 27]
      },
      {
        name: this.findDuoName(28, 29),
        description: "Release Date: March 9, 2025",
        characterIds: [28, 29]
      },
      {
        name: this.findDuoName(23, 31),
        description: "Release Date: March 15, 2025",
        characterIds: [23, 31]
      },
      {
        name: this.findDuoName(30, 35),
        description: "Release Date: May 7, 2025",
        characterIds: [30, 35]
      },
      {
        name: this.findDuoName(32, 34),
        description: "Release Date: May 12, 2025",
        characterIds: [32, 34]
      },
      {
        name: this.findDuoName(37, 38),
        description: "Release Date: June 24, 2025",
        characterIds: [37, 38]
      },
      {
        name: "Celestia Expansion Pack",
        description: "Release Date: June 24, 2025",
        characterIds: [39, 40]
      },
      {
        name: "Primelle Expansion Pack",
        description: "Release Date: June 27, 2025",
        characterIds: [41, 42]
      },
      {
        "name": this.findDuoName(44, 45),
        "description": "Release Date: July 10, 2025",
        "characterIds": [44, 45]
      },
      {
        "name": this.findDuoName(46, 47),
        "description": "Release Date: July 27, 2025",
        "characterIds": [46, 47]
      },
      {
        "name": this.findDuoName(48, 50),
        "description": "Release Date: August 15, 2025",
        "characterIds": [48, 50]
      },
      {
        "name": "Riri & Ruru",
        "description": "Release Date: August 23, 2025",
        "characterIds": [52, 53]
      },
      {
        "name": this.findDuoName(56, 57),
        "description": "Release Date: September 17, 2025",
        "characterIds": [56, 57]
      },
      {
        "name": "Maribelle Expansion Pack",
        "description": "Release Date: September 28, 2025",
        "characterIds": [58, 59, 60, 64]
      },
      {
        "name": this.findDuoName(65, 66),
        "description": "Release Date: October 28, 2025",
        "characterIds": [65, 66]
      },
      {
        "name": this.findDuoName(67, 68),
        "description": "Release Date: November 2, 2025",
        "characterIds": [67, 68]
      },
      {
        "name": this.findDuoName(55, 69),
        "description": "Release Date: November 5, 2025",
        "characterIds": [55, 69]
      },
      {
        "name": this.findDuoName(71, 72),
        "description": "Release Date: November 19, 2025",
        "characterIds": [71, 72]
      },
      {
        "name": "Maids Expansion Pack",
        "description": "Release Date: December 10, 2025",
        "characterIds": [74, 75]
      },
      {
        "name": this.findDuoName(54, 76),
        "description": "Release Date: December 14, 2025",
        "characterIds": [54, 76]
      },
      {
        "name": this.findDuoName(73, 77),
        "description": "Release Date: December 17, 2025",
        "characterIds": [73, 77]
      },
      {
        "name": this.findDuoName(36, 78),
        "description": "Release Date: December 28, 2025",
        "characterIds": [36, 78]
      },
      {
        "name": "Magical Girl Expansion Pack",
        "description": "Release Date: January 1, 2026",
        "characterIds": [79, 80]
      },
      {
        "name": this.findDuoName(81, 82),
        "description": "Release Date: January 1, 2026",
        "characterIds": [81, 82]
      },
      {
        "name": this.findDuoName(83, 84),
        "description": "Release Date: January 4, 2026",
        "characterIds": [83, 84]
      },
      {
        "name": this.findDuoName(86, 88),
        "description": "Release Date: January 16, 2026",
        "characterIds": [86, 88]
      }
    ];

    this.duos = duoDefinitions.map((def, index) => ({
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
    this.selectedCharacter = character;
  }

  findDuoName(id1: number, id2: number): string {
    // Sort IDs to ensure consistent lookup
    const [sortedId1, sortedId2] = [id1, id2].sort((a, b) => a - b);
    
    // Look for duo in duoPairs loaded from duos.json
    const duoPair = this.duoPairs.find(duo => 
      duo.id1 === sortedId1 && duo.id2 === sortedId2
    );
    
    if (duoPair) {
      // Use altName if the IDs were provided in reverse order
      return (id1 > id2 && duoPair.altName) ? duoPair.altName : duoPair.name;
    }
    
    // Fallback to default format if not found
    const char1 = this.characters.find(c => c.id === id1);
    const char2 = this.characters.find(c => c.id === id2);
    if (char1 && char2) {
      return `${char1.shortName} & ${char2.shortName}`;
    }
    return 'Unknown Duo';
  }
}
