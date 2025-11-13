import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Mood } from '../../services/mood.service';
import { CommonModule } from '@angular/common';
import { CharacterService, Character } from '../../services/character.service';
import { RouterLink } from '@angular/router';

const FALLBACK_MOOD: Mood = {
  name: "",
  emoji: "",
  arg: "",
  description: ""
};

@Component({
  selector: 'app-mood-modal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mood-modal.html',
  styleUrl: './mood-modal.scss'
})
export class MoodModal {
  @Input() mood: Mood = FALLBACK_MOOD;
  @Output() close = new EventEmitter<void>();
  characters: Character[] = [];

  constructor(private characterService: CharacterService) {
    this.characterService.getCharacters().subscribe(data => {
      this.characters = data;
    });
  }

  get filteredCharacters(): Character[] {
    switch (this.mood.arg) {
      case 'moe':
        return this.characters.filter(c => (c.moe >= 7 || c.color === 'pink') && c.tier <= 3);
      case 'red':
        return this.characters.filter(c => c.color === 'red' && c.tier <= 3);
      case 'blue':
        return this.characters.filter(c => c.color === 'blue' && c.tier <= 3);
      case 'futuristic':
        return this.characters.filter(c => c.futuristic >= 7 && c.tier <= 3);
      case 'traditional':
        return this.characters.filter(c => c.futuristic <= 4 && c.tier <= 3);
      case 'male':
        return this.characters.filter(c => c.pronouns === 'he/him' && c.tier <= 3);
      case 'female':
        return this.characters.filter(c => c.pronouns === 'she/her' && c.tier <= 3);
      case 'moe0':
        return this.characters.filter(c => c.moe < 4 && c.tier <= 3);
      case 'chatted':
        return this.characters.filter(c => {
          const key = 'chatLink_' + (c.name || 'unknown');
          return localStorage.getItem(key) !== null && c.tier <= 3;
        });
      case 'chatted0':
        return this.characters.filter(c => {
          const key = 'chatLink_' + (c.name || 'unknown');
          return localStorage.getItem(key) === null && c.tier <= 3;
        });
      case 'favorites':
        return this.characters.filter(c => c.tier <= 2).sort((a, b) => a.tier - b.tier);
      default:
        return [];
    }
  }

  ngOnInit() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  ngOnDestroy() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleClickOutside = (event: MouseEvent) => {
    const modal = document.getElementById('moodModal');
    if (modal && !modal.contains(event.target as Node)) {
      this.close.emit();
    }
  };

  get displayedMood(): Mood {
    return this.mood ?? FALLBACK_MOOD;
  }

  assetPath(path: string) {
    const assetUrl = 'assets/' + path;
    return path ? assetUrl : 'assets/Icons/Unknown-Mood.png';
  }

  @Output() selectCharacter = new EventEmitter<Character>();

  selectRandomCharacter() {
    const sourceCharacters = (this.filteredCharacters && this.filteredCharacters.length > 0)
      ? this.filteredCharacters
      : this.characters.filter(c => c.type !== 'me' && (c.type === 'active' || c.type === 'semi-active'));
    // Create weighted array based on tier
    const weightedCharacters: Character[] = [];
    sourceCharacters.forEach(character => {
      let weight = 1; // Default weight for tier 3
      if (character.tier === 1) {
        weight = 3;
      } else if (character.tier === 2) {
        weight = 2;
      }
      
      for (let i = 0; i < weight; i++) {
        weightedCharacters.push(character);
      }
    });

    const sourceToUse = weightedCharacters.length > 0 ? weightedCharacters : sourceCharacters;
    if (sourceToUse && sourceToUse.length > 0) {
      const idx = Math.floor(Math.random() * sourceToUse.length);
      const selectedCharacter = sourceToUse[idx];
      const chatLink = this.getChatLink(selectedCharacter);
      if (chatLink) {
        window.open(chatLink, '_blank');
      }
    }
  }

  getChatLink(character: Character): string {
    const key = 'chatLink_' + (character.name || 'unknown');
    const stored = localStorage.getItem(key);
    return stored ? stored : character.link;
  }
}
