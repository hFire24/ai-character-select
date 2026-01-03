import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CharacterStats {
  active: number;
  inactive: number;
  side: number;
  retired: number;
  misc: number;
  total: number;
}

@Component({
  selector: 'app-stats-container',
  imports: [CommonModule],
  templateUrl: 'stats-container.html',
  styleUrl: 'stats-container.scss'
})
export class StatsContainer {
  @Input() stats!: CharacterStats;
}
