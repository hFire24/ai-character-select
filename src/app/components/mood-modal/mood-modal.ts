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
  @Input() showInactive: boolean = false;
  @Input() showRetired: boolean = false;
  @Output() close = new EventEmitter<void>();
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
    });
  }

  private allowsInactive(c: Character): boolean {
    return c.status === 'active' || (c.status === 'inactive' && this.showInactive) || (c.status === 'retired' && this.showRetired);
  }

  private allowsTier(c: Character): boolean {
    return c.tier < 8;
  }

  get filteredCharacters(): Character[] {
    switch (this.mood.arg) {
      case 'moe':
        return this.characters.filter(c => (c.moe >= 7 || c.color === 'pink') && this.allowsTier(c) && this.allowsInactive(c));
      case 'blue':
        return this.characters.filter(c => c.color === 'blue' && this.allowsTier(c) && this.allowsInactive(c));
      case 'rp':
        return this.characters.filter(c => (c.color === 'pink' || c.color === 'red') && this.allowsTier(c) && this.allowsInactive(c));
      case 'futuristic':
        return this.characters.filter(c => c.futuristic >= 7 && this.allowsTier(c) && this.allowsInactive(c));
      case 'traditional':
        return this.characters.filter(c => c.futuristic <= 4 && this.allowsTier(c) && this.allowsInactive(c));
      case 'male':
        return this.characters.filter(c => c.pronouns === 'he/him' && this.allowsTier(c) && this.allowsInactive(c));
      case 'female':
        return this.characters.filter(c => c.pronouns === 'she/her' && this.allowsTier(c) && this.allowsInactive(c));
      case 'moe0':
        return this.characters.filter(c => c.moe < 4 && this.allowsTier(c) && this.allowsInactive(c));
      case 'chatted':
        return this.characters.filter(c => {
          const key = 'chatLink_' + (c.id || 'unknown');
          return localStorage.getItem(key) !== null && !c.status.includes('side');
        });
      case 'chatted0':
        return this.characters.filter(c => {
          const key = 'chatLink_' + (c.id || 'unknown');
          return localStorage.getItem(key) === null && this.allowsTier(c) && this.allowsInactive(c);
        });
      case 'favorites':
        return this.characters.filter(c => c.tier <= 3).sort((a, b) => a.tier - b.tier);
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
    let modifiedPath = path;
    if (path && path.includes('ChatGPT')) {
      modifiedPath = path.replace('ChatGPT', 'ChatGPT-Mood');
    }
    const assetUrl = 'assets/' + modifiedPath;
    return path ? assetUrl : 'assets/Icons/extended/Unknown-Mood.png';
  }

  @Output() selectCharacter = new EventEmitter<Character>();

  selectRandomCharacter() {
    const sourceCharacters = (this.filteredCharacters && this.filteredCharacters.length > 0)
      ? this.filteredCharacters
      : this.characters.filter(c => this.allowsInactive(c));
    // Create weighted array based on tier
    const weightedCharacters: Character[] = [];
    sourceCharacters.forEach(character => {
      let weight = 1; // Default weight for tier 4
      if (character.tier === 1) {
        weight = 4;
      } else if (character.tier === 2) {
        weight = 3;
      } else if (character.tier === 3) {
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
    const key = 'chatLink_' + (character.id || 'unknown');
    const stored = localStorage.getItem(key);
    return stored ? stored : character.link;
  }
}
