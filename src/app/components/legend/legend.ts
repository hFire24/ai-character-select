import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderButtons } from '../header-buttons/header-buttons';
import { Mood } from '../../services/mood.service';

@Component({
  selector: 'app-legend',
  imports: [CommonModule, HeaderButtons],
  templateUrl: './legend.html',
  styleUrl: './legend.scss'
})
export class Legend {
  @Input() showMoreCharacters = false;
  @Output() selectMood = new EventEmitter<Mood>();
  isCollapsed = false;
  selectedMood: Mood | null = null;

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  onMoodSelected(mood: Mood) {
    this.selectedMood = mood;
    this.selectMood.emit(mood);
  }
}
