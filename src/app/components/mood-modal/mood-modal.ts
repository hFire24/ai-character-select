import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Mood } from '../../services/mood.service';
import { CommonModule } from '@angular/common';
import { CharacterService, Character } from '../../services/character.service';
import html2canvas from 'html2canvas';

const FALLBACK_MOOD: Mood = {
  name: "",
  emoji: "",
  arg: "",
  description: ""
};

@Component({
  selector: 'app-mood-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mood-modal.html',
  styleUrl: './mood-modal.scss'
})
export class MoodModal {
  @Input() mood: Mood = FALLBACK_MOOD;
  @Output() close = new EventEmitter<void>();
  characters: Character[] = [];

  constructor(private characterService: CharacterService) {
    this.characterService.getCharacters().subscribe(data => {
      this.characters = data.filter(c => c.type === 'active');
    });
  }

  get filteredCharacters(): Character[] {
    switch (this.mood.arg) {
      case 'serious':
        return this.characters.filter(c => c.serious);
      case 'chaos':
        return this.characters.filter(c => c.chaos);
      case 'joy':
        return this.characters.filter(c => !c.emotion.includes('sad') && !c.emotion.includes('angry') && !c.emotion.includes('shy') && c.moe >= 4 || c.emotion.includes('joy'));
      case 'sad':
        return this.characters.filter(c => c.emotion.includes('sad') || c.emotion.includes('angry'));
      case 'male':
        return this.characters.filter(c => c.pronouns === 'he/him');
      case 'female':
        return this.characters.filter(c => c.pronouns === 'she/her');
      case 'moe0':
        return this.characters.filter(c => c.moe < 4);
      case 'moe':
        return this.characters.filter(c => c.moe >= 7);
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
    return '/assets/' + path;
  }

  @Output() selectCharacter = new EventEmitter<Character>();

  selectRandomCharacter() {
    const sourceCharacters = (this.filteredCharacters && this.filteredCharacters.length > 0)
      ? this.filteredCharacters
      : this.characters;
    if (sourceCharacters && sourceCharacters.length > 0) {
      const idx = Math.floor(Math.random() * sourceCharacters.length);
      const selectedCharacter = sourceCharacters[idx];
      if (selectedCharacter.link) {
        window.open(selectedCharacter.link, '_blank');
      }
    }
  }

  isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);
  }
  
  async screenshot(elementId: string) {
    const element = document.getElementById(elementId);
    const closeBtn = document.getElementById('closeModal');
    const modalFooter = document.getElementById('modalFooter');

    // Hide close button and modal footer
    if (closeBtn) closeBtn.style.display = 'none';
    if (modalFooter) modalFooter.style.display = 'none';

    if (element) {
      const originalBackground = element.style.backgroundColor;
      const computedBackground = getComputedStyle(element).backgroundColor;
      element.style.backgroundColor = computedBackground;
      const canvas = await html2canvas(element, {
        backgroundColor: computedBackground,
        scale: 2 // Increase scale for better quality
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new window.ClipboardItem({ 'image/png': blob })
            ]);
            alert('Screenshot copied to clipboard!');
          } catch (err) {
            alert('Failed to copy screenshot to clipboard.');
          }
        }
        // Unhide close button and modal footer
        if (closeBtn) closeBtn.style.display = '';
        if (modalFooter) modalFooter.style.display = '';
        element.style.backgroundColor = originalBackground; // Restore original background
      }, 'image/png');
    } else {
      // Unhide if element not found
      if (closeBtn) closeBtn.style.display = '';
      if (modalFooter) modalFooter.style.display = '';
    }
  }
}
