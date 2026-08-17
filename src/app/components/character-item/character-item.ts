import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character, CharacterService } from '../../services/character.service';
import { RelativeDatePipe } from '../../pipes/relative-date.pipe';

@Component({
  selector: 'app-character-item',
  imports: [CommonModule, RelativeDatePipe],
  templateUrl: './character-item.html',
  styleUrl: './character-item.scss'
})
export class CharacterItem {
  private static openItem: CharacterItem | null = null;
  @Input({ required: true }) character!: Character;
  @Input() timestamp?: Date;
  @Input() chatCount?: number;
  @Input() weeklyChatCount?: number;
  @Input() showChatInfo = true;
  @Output() characterClick = new EventEmitter<Character>();
  tierMenuOpen = false;
  tierMenuX = 0;
  tierMenuY = 0;

  constructor(private characterService: CharacterService) {}

  get allowedTiers(): number[] {
    return this.characterService.getAllowedTiersForStatus(this.character.status);
  }

  onClick() {
    this.characterClick.emit(this.character);
  }

  openTierMenu(event: MouseEvent): void {
    if (this.character.status !== 'active' || event.shiftKey) return;
    event.preventDefault();
    event.stopPropagation();
    CharacterItem.openItem?.closeTierMenu();
    CharacterItem.openItem = this;
    this.tierMenuX = event.clientX;
    this.tierMenuY = event.clientY;
    this.tierMenuOpen = true;
  }

  updateTier(tier: number, event: Event): void {
    event.stopPropagation();
    if (!this.characterService.isTierValidForStatus(this.character.status, tier)) return;
    this.character.tier = tier;
    this.characterService.saveTierOverride(this.character.id, tier);
    this.tierMenuOpen = false;
  }

  @HostListener('document:click')
  @HostListener('document:contextmenu')
  closeTierMenu(): void {
    this.tierMenuOpen = false;
    if (CharacterItem.openItem === this) CharacterItem.openItem = null;
  }
}
