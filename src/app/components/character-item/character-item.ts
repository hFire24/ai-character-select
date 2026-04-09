import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from '../../services/character.service';
import { RelativeDatePipe } from '../../pipes/relative-date.pipe';

@Component({
  selector: 'app-character-item',
  imports: [CommonModule, RelativeDatePipe],
  templateUrl: './character-item.html',
  styleUrl: './character-item.scss'
})
export class CharacterItem {
  @Input({ required: true }) character!: Character;
  @Input() timestamp?: Date;
  @Input() chatCount?: number;
  @Input() weeklyChatCount?: number;
  @Input() showChatInfo = true;
  @Output() characterClick = new EventEmitter<Character>();

  onClick() {
    this.characterClick.emit(this.character);
  }
}
