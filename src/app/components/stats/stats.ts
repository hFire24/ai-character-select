import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService, Character } from '../../services/character.service';
import { BackButton } from '../back-button/back-button';
import { DeviceService } from '../../services/device.service';
import { StatsContainer } from '../stats-container/stats-container';
import { CharacterList } from '../character-list/character-list';
import { CharacterModal } from '../character-modal/character-modal';

interface CharacterStats {
  active: number;
  inactive: number;
  side: number;
  retired: number;
  misc: number;
  total: number;
}

interface LastChattedCharacter {
  character: Character;
  timestamp: Date;
}

@Component({
  selector: 'app-stats',
  imports: [CommonModule, BackButton, StatsContainer, CharacterList, CharacterModal],
  templateUrl: 'stats.html',
  styleUrl: 'stats.scss'
})
export class Stats implements OnInit {
  @Output() selectCharacter = new EventEmitter<Character>();
  selectedCharacter: Character | null = null;
  
  stats: CharacterStats = {
    active: 0,
    inactive: 0,
    side: 0,
    retired: 0,
    misc: 0,
    total: 0
  };
  
  lastChattedCharacters: LastChattedCharacter[] = [];
  neverChattedCharacters: Character[] = [];
  isDesktop = false;

  constructor(
    private characterService: CharacterService,
    private deviceService: DeviceService
  ) {}

  ngOnInit() {
    this.isDesktop = this.deviceService.isDesktop();
    this.calculateStats();
    if (this.isDesktop) {
      this.loadLastChattedCharacters();
    }
  }

  calculateStats() {
    this.characterService.getCharactersPlusCriticizer().subscribe((characters: Character[]) => {
      this.stats.active = characters.filter(c => c.type === 'active').length;
      this.stats.inactive = characters.filter(c => c.type === 'inactive').length;
      this.stats.side = characters.filter(c => c.type.includes('side')).length;
      this.stats.retired = characters.filter(c => c.type === 'retired').length;
      this.stats.misc = characters.filter(c => !['active', 'inactive', 'side', 'inactive side', 'retired'].includes(c.type)).length;
      this.stats.total = characters.length;
    });
  }

  loadLastChattedCharacters() {
    this.characterService.getCharactersPlusCriticizer().subscribe((characters: Character[]) => {
      const chatsWithTimestamps: LastChattedCharacter[] = [];
      const neverChatted: Character[] = [];

      characters.forEach(character => {
        const timestampKey = 'chatLinkTimestamp_' + (character.id || 'unknown');
        const timestamp = localStorage.getItem(timestampKey);
        
        if (timestamp) {
          chatsWithTimestamps.push({
            character: character,
            timestamp: new Date(timestamp)
          });
        } else if (character.type === 'active') {
          // Only track active characters that have never been chatted with
          neverChatted.push(character);
        }
      });

      // Sort by most recent first
      this.lastChattedCharacters = chatsWithTimestamps.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
      
      // Don't sort never chatted characters - keep original order
      this.neverChattedCharacters = neverChatted;
    });
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  onCharacterClick(character: Character) {
    this.selectedCharacter = character;
  }
}
