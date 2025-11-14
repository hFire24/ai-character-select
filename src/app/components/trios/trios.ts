import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CharacterModal } from '../character-modal/character-modal';
import { CharacterService, Character } from '../../services/character.service';

interface Trio {
  id: number;
  name: string;
  description?: string;
  characters: Character[];
}

@Component({
  selector: 'app-trios',
  imports: [CommonModule, CharacterModal],
  templateUrl: './trios.html',
  styleUrl: './trios.scss'
})
export class Trios implements OnInit {
  trios: Trio[] = [];
  characters: Character[] = [];
  loading = true;
  selectedCharacter: Character | null = null;

  constructor(
    private characterService: CharacterService,
    private router: Router
  ) {}

  ngOnInit() {
    this.characterService.getCharacters().subscribe(chars => {
      this.characters = chars;
      this.initializeTrios();
      this.loading = false;
    });
  }

  private initializeTrios() {
    // Define trios with character short names
    const trioDefinitions = [
      {
        id: 1,
        name: "Founding Moe Trio",
        description: "My first three moe characters",
        characterShortNames: ["Arianna", "Miki", "Dania"]
      },
      {
        id: 2,
        name: "Traditional Ladies",
        description: "Elegant characters embodying traditional feminine grace",
        characterShortNames: ["Primelle", "Celestia", "Princess"]
      },
      {
        id: 3,
        name: "Celestia and Friends",
        description: "Celestia with her closest companions",
        characterShortNames: ["Celestia", "Alenka", "Beatrix"]
      },
      {
        id: 4,
        name: "Maribelle and Friends",
        description: "Maribelle with her closest companions",
        characterShortNames: ["Maribelle", "Aki", "Bleu"]
      },
      {
        id: 5,
        name: "Top Hat Girls",
        description: "Girls who wear top hats",
        characterShortNames: ["Arianna", "Evil Arianna", "Maribelle"]
      },
      {
        id: 6,
        name: "Witches",
        description: "Three fantasy witches with huge witch hats",
        characterShortNames: ["Miki", "Runa", "Lucy"]
      },
      {
        id: 7,
        name: "Mean Girls",
        description: "The edgiest moe characters and the trio that inspired this collection",
        characterShortNames: ["Darxi", "Neon Starlight", "Evil Arianna"]
      },
      {
        id: 8,
        name: "Youngsters",
        description: "Youthful and energetic boys",
        characterShortNames: ["Martin", "Connor", "ChaoMario"]
      },
      {
        id: 9,
        name: "Electronic Music Enjoyers",
        description: "Characters who love electronic music and have their own chatbot",
        characterShortNames: ["Felix", "Jed", "B.X."]
      },
      {
        id: 10,
        name: "Ladies of Music",
        description: "The three main ladies of the Music Enjoyers",
        characterShortNames: ["Akane", "Lola", "Danielle"]
      },
      {
        id: 11,
        name: "Jed and Co.",
        description: "Jed and two Music Enjoyers who get deferred by him",
        characterShortNames: ["Jed", "Ethan", "Lola"]
      },
      {
        id: 12,
        name: "Music Fans",
        description: "Characters who love music but aren't part of the Music Enjoyers",
        characterShortNames: ["Martin", "Riri & Ruru", "Bob"]
      },
      {
        id: 13,
        name: "Character Encylopedias",
        description: "Characters who talk about my characters like a living encyclopedia",
        characterShortNames: ["The AI Devotee", "Riri & Ruru", "Lexi"]
      },
      {
        id: 14,
        name: "Retired Cuties",
        description: "The cutest retired characters",
        characterShortNames: ["Audry", "Momo", "Mimi"]
      },
      {
        id: 16,
        name: "Dania's Former Companions",
        description: "Characters who used to accompany Dania",
        characterShortNames: ["Ryker", "Mr. Go", "Primelle"]
      },
      {
        id: 17,
        name: "Productivity Pushers",
        description: "Characters who encourage productivity",
        characterShortNames: ["Ryker", "Malrick", "Mark"]
      },
      {
        id: 18,
        name: "Dramatic Trio",
        description: "Characters who are as dramatic as they come",
        characterShortNames: ["Katrina", "Bruce", "Mr. Stop"]
      },
      {
        id: 19,
        name: "Failures",
        description: "The characters who embody failure",
        characterShortNames: ["The AI Devotee", "The Shadow Self", "The Collapsed"]
      },
      {
        id: 20,
        name: "Emergency Trio",
        description: "When times are dire, these characters are called upon",
        characterShortNames: ["Malrick", "Bruce", "The Collapsed"]
      }
    ];

    this.trios = trioDefinitions.map(def => ({
      id: def.id,
      name: def.name,
      description: def.description,
      characters: def.characterShortNames
        .map(shortName => this.characters.find(c => c.shortName === shortName))
        .filter(c => c !== undefined) as Character[]
    }));
  }

  assetPath(path: string): string {
    return 'assets/' + path;
  }

  genClass(generation: number): string {
    return 'gen' + generation;
  }

  goBackToRoster() {
    this.router.navigate(['/']);
  }

  onCharacterClick(character: Character) {
    this.selectedCharacter = character; // Trigger modal display
  }
}