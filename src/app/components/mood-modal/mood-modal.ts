import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Mood } from '../../services/mood.service';
import { CommonModule } from '@angular/common';
import { CharacterService, Character } from '../../services/character.service';
import { RouterLink } from '@angular/router';
import { CharacterFilterPipe, CharacterFilterOptions } from '../../pipes/character-filter.pipe';

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

  private getStatusFilter(): CharacterFilterOptions['status'] {
    const statusFilter: any = {};
    if (this.showInactive) {
      statusFilter.active = true;
      statusFilter.inactive = true;
    } else {
      statusFilter.active = true;
    }
    if (this.showRetired) {
      statusFilter.retired = true;
    }
    return statusFilter;
  }

  private getFilterOptions(): CharacterFilterOptions {
    const baseOptions: CharacterFilterOptions = {
      status: this.getStatusFilter(),
      tier: { max: 7 } // tier < 8
    };

    switch (this.mood.arg) {
      case 'moe':
        return {
          ...baseOptions,
          customFilter: (c: Character) => c.moe >= 7 || c.color === 'pink'
        };
      case 'blue':
        return {
          ...baseOptions,
          attributes: { colors: ['blue'] }
        };
      case 'rp':
        return {
          ...baseOptions,
          attributes: { colors: ['pink', 'red'] }
        };
      case 'futuristic':
        return {
          ...baseOptions,
          attributes: { futuristic: { min: 7 } }
        };
      case 'traditional':
        return {
          ...baseOptions,
          attributes: { futuristic: { max: 4 } }
        };
      case 'male':
        return {
          ...baseOptions,
          attributes: { pronouns: ['he/him'] }
        };
      case 'female':
        return {
          ...baseOptions,
          attributes: { pronouns: ['she/her'] }
        };
      case 'moe0':
        return {
          ...baseOptions,
          attributes: { moe: { max: 3 } }
        };
      case 'chatted':
        return {
          customFilter: (c: Character) => {
            const key = 'chatLink_' + (c.id || 'unknown');
            return localStorage.getItem(key) !== null && !c.status.includes('side');
          }
        };
      case 'chatted0':
        return {
          ...baseOptions,
          customFilter: (c: Character) => {
            const key = 'chatLink_' + (c.id || 'unknown');
            return localStorage.getItem(key) === null;
          }
        };
      case 'favorites':
        return {
          tier: { favorite: true } // tier <= 3
        };
      default:
        return {
          ...baseOptions
        };
    }
  }

  get filteredCharacters(): Character[] {
    const pipe = new CharacterFilterPipe();
    const filtered = pipe.transform(this.characters, this.getFilterOptions());
    
    // Special case: favorites should be sorted by tier
    if (this.mood.arg === 'favorites') {
      return filtered.sort((a, b) => a.tier - b.tier);
    }
    
    return filtered;
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
    const assetUrl = 'assets/Icons/' + modifiedPath;
    return path ? assetUrl : 'assets/Icons/extended/Unknown-Mood.png';
  }

  @Output() selectCharacter = new EventEmitter<Character>();

  selectRandomCharacter() {
    let sourceCharacters = (this.filteredCharacters && this.filteredCharacters.length > 0)
      ? this.filteredCharacters
      : (() => {
          const pipe = new CharacterFilterPipe();
          return pipe.transform(this.characters, { status: this.getStatusFilter() });
        })();
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
      
      // Show the character modal
      this.selectCharacter.emit(selectedCharacter);
      
      // Close the mood modal (consistent with clicking "Details" on a character)
      this.close.emit();
      
      // Also open the chat link
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
