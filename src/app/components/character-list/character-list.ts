import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from '../../services/character.service';
import { RelativeDatePipe } from '../../pipes/relative-date.pipe';

interface LastChattedCharacter {
  character: Character;
  timestamp: Date;
}

@Component({
  selector: 'app-character-list',
  imports: [CommonModule, RelativeDatePipe],
  templateUrl: 'character-list.html',
  styleUrl: 'character-list.scss'
})
export class CharacterList {
  @Input() lastChattedCharacters: LastChattedCharacter[] = [];
  @Input() neverChattedCharacters: Character[] = [];
  @Input() isDesktop = false;
  @Output() selectCharacter = new EventEmitter<Character>();

  onCharacterClick(character: Character) {
    this.selectCharacter.emit(character);
  }
}
