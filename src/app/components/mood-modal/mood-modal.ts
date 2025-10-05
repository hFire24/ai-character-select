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
      case 'serious':
        return this.characters.filter(c => (c.serious || c.emotion.includes('straightforward')) && c.importance >= 6);
      case 'chaos':
        return this.characters.filter(c => c.chaos && c.importance >= 6);
      case 'joy':
        return this.characters.filter(c => (!c.emotion.includes('sad') && !c.emotion.includes('angry') && !c.emotion.includes('shy') && c.moe >= 6 || c.emotion.includes('joy')) && c.importance >= 6);
      case 'edgy':
        return this.characters.filter(c => (c.emotion.includes('edgy') && c.type !== 'side'));
      case 'quiet':
        return this.characters.filter(c => (c.emotion.includes('shy') || c.emotion.includes('calm')) && c.importance >= 6);
      case 'sad':
        return this.characters.filter(c => (c.emotion.includes('sad') || c.emotion.includes('angry')) && (c.type !== 'side'));
      case 'male':
        return this.characters.filter(c => c.pronouns === 'he/him' && c.importance >= 6);
      case 'female':
        return this.characters.filter(c => c.pronouns === 'she/her' && c.importance >= 6);
      case 'moe0':
        return this.characters.filter(c => c.moe < 4 && c.importance >= 6);
      case 'moe':
        return this.characters.filter(c => c.moe >= 7 && c.importance >= 6);
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
    if (sourceCharacters && sourceCharacters.length > 0) {
      const idx = Math.floor(Math.random() * sourceCharacters.length);
      const selectedCharacter = sourceCharacters[idx];
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
