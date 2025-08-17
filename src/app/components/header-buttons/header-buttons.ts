import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MoodService, Mood } from '../../services/mood.service';

@Component({
  selector: 'app-header-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-buttons.html',
  styleUrl: './header-buttons.scss'
})
export class HeaderButtons {
  moods: Mood[] = []; // Initialize with fallback mood

  constructor(private moodService: MoodService) {
    this.moodService.getMoods().subscribe(data => {
      this.moods = data;
    });
  }

  @Output() selectMood = new EventEmitter<Mood>();
}
