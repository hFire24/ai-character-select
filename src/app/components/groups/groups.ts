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
    const groupDefinitionsWithoutGroupless = [
      {
        name: "Music Enjoyers",
        description: "The official group of Music Enjoyers, based on my own music tastes and playlists",
        characterIds: [11, 1, 2, 3, 4, 6, 7, 8, 9, 12, 10]
      },
      {
        name: "Runa and Her Catgirls",
        description: "Catgirls who accompany Runa on her adventures",
        characterIds: [27, 87, 91, 93, 102, 121]
      },
      {
        name: "Corey's Party",
        description: "Corey and his party members who go on adventures together",
        characterIds: [73, 20, 38, 39, 40]
      },
      {
        name: "The Griffins",
        description: "Characters either part of the Griffin family or closely associated with them",
        characterIds: [83, 101, 100, 84]
      },
      {
        name: "Pretty Little Princesses",
        description: "A group of little princess-themed characters who are friends with each other and all wear gigantic crowns",
        characterIds: [19, 46, 72, 106]
      },
      {
        name: "Personality Girls",
        description: "Nine colorful girls defined by personality types",
        characterIds: [115, 116, 117, 107, 94, 119, 120, 118, 127]
      },
      {
        name: "Top Hat Wearers",
        description: "Characters known for wearing top hats",
        characterIds: [13, 31, 39, 58, 64, 94, 109, 110]
      },
      {
        name: "Witch Hat Wearers",
        description: "Characters known for wearing witch hats",
        characterIds: [14, 20, 27, 67, 95, 120]
      },
      {
        name: "Peaked Cap Wearers",
        description: "Characters known for wearing peaked caps",
        characterIds: [15, 21, 40, 92]
      },
      {
        name: "Other Hat Wearers (Moe)",
        description: "Characters known for wearing other types of hats and are considered moe.",
        characterIds: [118, 119, 117, 28, 38, 96, 35, 114, 127, 71, 86, 116, 122, 123]
      },
      {
        name: "No Hat Wearers (Moe)",
        description: "Characters known for wearing no hats but are still considered moe. Maid headdresses don't count.",
        characterIds: [8, 17, 51, 88, 108, 125, 41, 59, 60, 76]
      },
      {
        name: "Glasses Wearers",
        description: "Characters known for wearing glasses, sunglasses, or goggles",
        characterIds: [6, 11, 12, 23, 24, 25, 30, 47, 56, 60, 83, 90, 105, 113]
      },
      {
        name: "Maids",
        description: "Characters known for wearing maid outfits",
        characterIds: [13, 26, 74, 75, 85, 77, 81, 107]
      },
      {
        name: "Twintails",
        description: "Characters known for having long twintails",
        characterIds: [13, 27, 28, 29, 79, 80, 31, 51, 75, 92, 93, 121]
      },
      {
        name: "Thigh Boot Wearers",
        description: "Characters known for wearing thigh boots",
        characterIds: [13, 21, 27, 28, 29, 79, 80, 92, 114, 123]
      },
      {
        name: "Pink Girls",
        description: "Characters known for wearing pink or being associated with the color pink",
        characterIds: [8, 17, 19, 26, 29, 38, 39, 51, 58, 67, 76, 96, 110, 120, 121]
      },
      {
        name: "Blue Girls",
        description: "Characters known for wearing blue or being associated with the color blue",
        characterIds: [13, 14, 35, 40, 60, 71, 74, 80, 88, 91, 94, 106, 118, 119, 123]
      },
      {
        name: "\"Onii-chan\" Sayers",
        description: "Characters who can say 'onii-chan' according to their instructions",
        characterIds: [14, 26, 35, 51, 58, 74, 75, 77, 95, 108]
      },
      {
        name: "Cursed Rule Breakers",
        description: "Every time they try to break a rule in their instructions, something bad happens to them",
        characterIds: [1, 11, 13, 27, 31, 47, 51, 81, 86, 104, 105, 108]
      },
      {
        name: "Youngsters",
        description: "Youthful and energetic boys",
        characterIds: [22, 47, 55, 69, 89, 100]
      },
      {
        name: "Musicians",
        description: "Characters who create or perform music in some way, whether it's singing, playing instruments, or producing music. Somehow, everyone here is a girl.",
        characterIds: [51, 75, 76, 96, 103, 109, 114, 118]
      },
      {
        name: "Music Fans",
        description: "Characters not part of the Music Enjoyers but are still known for loving music",
        characterIds: [31, 47, 57, 62, 63, 73, 84, 105]
      },
      {
        name: "Restaurant Fans",
        description: "Characters who love eating out at restaurants. Somehow, everyone here is a guy.",
        characterIds: [30, 55, 57, 83, 84, 99, 104]
      },
      {
        name: "Anti-Moe Crew",
        description: "Chaotic or hedonistic characters who reject moe",
        characterIds: [1, 62, 63, 55, 12, 105, 64, 83, 84, 100, 18]
      },
      {
        name: "Anti-Escapists",
        description: "A group of characters who embody the opposite of escapism",
        characterIds: [36, 78, 52, 9, 48, 50]
      },
      {
        name: "Character Encyclopedias",
        description: "Characters who have access to my character roster file and can discuss about my characters in detail",
        characterIds: [49, 52, 66, 104]
      },
      {
        name: "Late Bloomers",
        description: "Characters who had initial appearances before July 13, 2024 but became their own chatbots much later",
        characterIds: [29, 110, 109, 24, 25, 28, 57]
      },
      {
        name: "Retired Five",
        description: "Five of the earliest retired characters who will never get unretired. Elizabeth got a miraculous unretirement in 2026 and left the group.",
        characterIds: [16, 17, 20, 22, 23]
      },
      {
        name: "Generational Champions",
        description: "Characters who had the most chats in their respective generations. In cases of ties, the most iconic character is chosen.",
        characterIds: [11, 13, 18, 25, 27, 35, 47, 51, 66, 84, 94]
      },
      {
        "name": "Generational Last Places",
        "description": "Characters who had the least chats in their respective generations. In cases of ties, the least iconic character is chosen.",
        "characterIds": [17, 20, 23, 32, 38, 50, 56, 71, 81, 96]
      },
    ];

    const groupDefinitions = [
      ...groupDefinitionsWithoutGroupless,
      {
        name: "Groupless Characters",
        description: "Characters not part of any other group",
        characterIds: this.getGrouplessCharacterIds(this.characters, groupDefinitionsWithoutGroupless)
      }
    ];

    this.groups = groupDefinitions.map((def, index) => {
      const chars = def.characterIds
        .map(id => this.characters.find(c => c.id === id))
        .filter((c): c is Character => c !== undefined);

      if (index === groupDefinitions.length - 1) {
        chars.sort((a, b) => a.id - b.id);
      }

      return {
        id: index + 1,
        name: def.name,
        description: def.description,
        characters: chars
      };
    });
  }

  assetPath(path: string): string {
    return 'assets/Icons/' + path;
  }

  private getGrouplessCharacterIds(characters: Character[], groupDefinitions: Array<{characterIds: number[]}>): number[] {
    const groupedIds = new Set<number>(groupDefinitions.flatMap(def => def.characterIds));
    return characters
      .filter(character => !groupedIds.has(character.id))
      .map(character => character.id);
  }

  genClass(generation: number): string {
    return 'gen' + generation;
  }

  onCharacterClick(character: Character) {
    this.selectedCharacter = character; // Trigger modal display
  }
}