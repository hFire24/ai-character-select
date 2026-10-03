import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Mood, MoodService } from '../../services/mood.service';
import { CommonModule } from '@angular/common';
import { CharacterService, Character } from '../../services/character.service';
import { RouterLink } from '@angular/router';
import { getEffectiveChatLink } from '../../utils/chat-link-storage';
import { DeviceService } from '../../services/device.service';

const FALLBACK_MOOD: Mood = {
  name: "",
  emoji: "",
  arg: "",
  selectable: false,
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

  constructor(
    private characterService: CharacterService,
    private deviceService: DeviceService,
    private moodService: MoodService
  ) {
    this.characterService.getCharacters().subscribe(data => {
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

  get filteredCharacters(): Character[] {
    return this.moodService.filterCharacters(this.characters, this.displayedMood, this);
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
    const filtered = this.filteredCharacters;
    const sourceCharacters = filtered.length > 0
      ? filtered
      : this.moodService.filterCharactersByStatus(this.characters, this);
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
      
      // Mobile users choose how to open the link from the character modal.
      if (!this.deviceService.isMobile()) {
        const chatLink = this.getChatLink(selectedCharacter);
        if (chatLink) {
          window.open(chatLink, '_blank');
        }
      }
    }
  }

  getChatLink(character: Character): string {
    return getEffectiveChatLink(character, this.characters);
  }
}
