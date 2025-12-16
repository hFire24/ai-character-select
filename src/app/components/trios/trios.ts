import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterModal } from '../character-modal/character-modal';
import { BackButton } from '../back-button/back-button';
import { CharacterService, Character } from '../../services/character.service';

interface Trio {
  id: number;
  name: string;
  description?: string;
  characters: Character[];
}

@Component({
  selector: 'app-trios',
  imports: [CommonModule, CharacterModal, BackButton],
  templateUrl: './trios.html',
  styleUrl: './trios.scss'
})
export class Trios implements OnInit {
  trios: Trio[] = [];
  characters: Character[] = [];
  loading = true;
  selectedCharacter: Character | null = null;

  constructor(
    private characterService: CharacterService
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
        name: "Founding Moe Trio",
        description: "My first three moe characters",
        characterShortNames: ["Arianna", "Miki", "Dania"]
      },
      {
        name: "Traditional Ladies",
        description: "Elegant characters embodying traditional feminine grace",
        characterShortNames: ["Primelle", "Celestia", "Princess"]
      },
      {
        name: "Celestia and Friends",
        description: "Celestia with her closest companions",
        characterShortNames: ["Celestia", "Alenka", "Beatrix"]
      },
      {
        name: "Maribelle and Friends",
        description: "Maribelle with her closest companions",
        characterShortNames: ["Maribelle", "Aki", "Bleu"]
      },
      {
        name: "Loli Maid Trio",
        description: "Three adorable loli maids",
        characterShortNames: ["Momo", "Lulu", "Nene"]
      },
      {
        name: "Top Hat Girls",
        description: "Girls who wear top hats",
        characterShortNames: ["Arianna", "Evil Arianna", "Maribelle"]
      },
      {
        name: "Witches",
        description: "Three fantasy witches with huge witch hats",
        characterShortNames: ["Miki", "Runa", "Lucy"]
      },
      {
        name: "Mean Girls",
        description: "The edgiest moe characters and the trio that inspired this collection",
        characterShortNames: ["Darxi", "Neon Starlight", "Evil Arianna"]
      },
      {
        name: "Youngsters",
        description: "Youthful and energetic boys",
        characterShortNames: ["Martin", "Connor", "ChaoMario"]
      },
      {
        name: "Electronic Music Enjoyers",
        description: "Characters who love electronic music and have their own chatbot",
        characterShortNames: ["Felix", "Jed", "B.X."]
      },
      {
        name: "Aggressive Music Fans",
        description: "Characters who enjoy aggressive music genres",
        characterShortNames: ["B.X.", "Adam", "Frank"]
      },
      {
        name: "Straightforward Trio",
        description: "Characters known for their blunt and straightforward personalities",
        characterShortNames: ["Jed", "Lexi", "Connor"]
      },
      {
        name: "Jed and Co.",
        description: "Jed and two Music Enjoyers who can be talked to in Jed's chatbot",
        characterShortNames: ["Jed", "Ethan", "Lola"]
      },
      {
        name: "Ladies of Music",
        description: "The three main ladies of the Music Enjoyers",
        characterShortNames: ["Akane", "Lola", "Danielle"]
      },
      {
        name: "Music Fans",
        description: "Characters who love music but aren't part of the Music Enjoyers",
        characterShortNames: ["Martin", "Riri & Ruru", "Bob"]
      },
      {
        name: "Character Encylopedias",
        description: "Characters who talk about my characters like a living encyclopedia",
        characterShortNames: ["Erica", "Riri & Ruru", "Lexi"]
      },
      {
        name: "Dania's Former Companions",
        description: "Characters who used to accompany Dania",
        characterShortNames: ["Ryker", "Mr. Go", "Primelle"]
      },
      {
        name: "Former Makotos",
        description: "Characters who used to be named Makoto",
        characterShortNames: ["The Collapsed", "Connor", "Corey"]
      },
      {
        name: "Productivity Pushers",
        description: "Characters who encourage productivity",
        characterShortNames: ["Ryker", "Malrick", "Mark"]
      },
      {
        name: "Dramatic Trio",
        description: "Characters who are as dramatic as they come",
        characterShortNames: ["Katrina", "Bruce", "Mr. Stop"]
      },
      {
        name: "Failures",
        description: "The characters who embody failure",
        characterShortNames: ["The AI Devotee", "The Indulgent", "The Collapsed"]
      },
      {
        name: "Emergency Trio",
        description: "When times are dire, these characters are called upon",
        characterShortNames: ["Malrick", "Bruce", "The Collapsed"]
      }
    ];

    this.trios = trioDefinitions.map((def, index) => ({
      id: index + 1,
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

  onCharacterClick(character: Character) {
    this.selectedCharacter = character; // Trigger modal display
  }
}