import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Character } from '../../../services/character.service';
import type { ChatHistoryChart } from '../chat-history-chart';

@Component({
  selector: 'app-history-character-picker',
  imports: [FormsModule],
  templateUrl: './character-picker.html',
  styleUrl: './character-picker.scss'
})
export class HistoryCharacterPicker {
  @Input({ required: true }) chart!: ChatHistoryChart;

  iconPath(character: Character) { return character.img ? `assets/Icons/${character.img}` : 'assets/Icons/extended/Unknown.png'; }
  useUnknownIcon(event: Event) { (event.currentTarget as HTMLImageElement).src = 'assets/Icons/extended/Unknown.png'; }
}
