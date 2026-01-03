import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService, Character } from '../../services/character.service';
import { BackButton } from '../back-button/back-button';

interface CharacterStats {
  active: number;
  inactive: number;
  side: number;
  retired: number;
  misc: number;
  total: number;
}

@Component({
  selector: 'app-stats',
  imports: [CommonModule, BackButton],
  templateUrl: 'stats.html',
  styleUrl: 'stats.scss'
})
export class Stats implements OnInit {
  stats: CharacterStats = {
    active: 0,
    inactive: 0,
    side: 0,
    retired: 0,
    misc: 0,
    total: 0
  };

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    this.calculateStats();
  }

  calculateStats() {
    this.characterService.getCharactersPlusCriticizer().subscribe((characters: Character[]) => {
      this.stats.active = characters.filter(c => c.type === 'active').length;
      this.stats.inactive = characters.filter(c => c.type === 'inactive').length;
      this.stats.side = characters.filter(c => c.type === 'side').length;
      this.stats.retired = characters.filter(c => c.type === 'retired').length;
      this.stats.misc = characters.filter(c => !['active', 'inactive', 'side', 'retired'].includes(c.type)).length;
      this.stats.total = characters.length;
    });
  }
}
