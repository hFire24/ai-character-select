import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Character } from '../../services/character.service';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';

const FALLBACK_CHARACTER: Character = {
  name: "",
  img: "",
  shortName: "",
  generation: 0,
  type: "",
  serious: false,
  chaos: false,
  musicEnjoyer: false,
  moe: 1,
  emotion: "",
  pronouns: "",
  link: "",
  interests: "",
  peeves: "",
  bestFor: "",
  funFact: "",
  description: "",
  retirementReason: ""
};

@Component({
  selector: 'app-character-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-modal.html',
  styleUrl: './character-modal.scss'
})
export class CharacterModal {
  @Input() character: Character = FALLBACK_CHARACTER;
  @Output() close = new EventEmitter<void>();

  ngOnInit() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  ngOnDestroy() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleClickOutside = (event: MouseEvent) => {
    const modal = document.getElementById('characterModal');
    if (modal && !modal.contains(event.target as Node)) {
      this.close.emit();
    }
  };

  get displayedCharacter(): Character {
    return this.character ?? FALLBACK_CHARACTER;
  }

  assetPath(path: string) {
    return 'assets/' + path;
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