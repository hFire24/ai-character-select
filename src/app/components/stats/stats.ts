import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService, Character } from '../../services/character.service';
import { BackButton } from '../back-button/back-button';
import { DeviceService } from '../../services/device.service';
import { StatsContainer } from '../stats-container/stats-container';
import { CharacterList } from '../character-list/character-list';
import { CharacterModal } from '../character-modal/character-modal';
import { CharacterFilterPipe } from '../../pipes/character-filter.pipe';

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
      const pipe = new CharacterFilterPipe();
      
      this.stats.active = pipe.transform(characters, { status: { active: true } }).length + 1; // +1 for ChatGPT
      this.stats.inactive = pipe.transform(characters, { status: { inactive: true } }).length;
      this.stats.side = pipe.transform(characters, { status: { side: true } }).length;
      this.stats.retired = pipe.transform(characters, { status: { retired: true } }).length;
      
      // Misc: characters that don't fit standard categories (future, me, etc.)
      this.stats.misc = pipe.transform(characters, {
        customFilter: (c: Character) => !['active', 'inactive', 'side', 'inactive side', 'retired', 'retired side'].includes(c.status)
      }).length;
      
      this.stats.total = characters.length + 1; // +1 for ChatGPT
    });
  }

  loadLastChattedCharacters() {
    this.characterService.getCharactersPlusCriticizer().subscribe((characters: Character[]) => {
      const chatsWithTimestamps: LastChattedCharacter[] = [];
      const pipe = new CharacterFilterPipe();

      this.characterService.getChatGPT().subscribe(chatGPTCharacter => {
        if (Array.isArray(chatGPTCharacter)) {
          characters.push(...chatGPTCharacter);
        } else {
          characters.push(chatGPTCharacter);
        }
      });

      characters.forEach(character => {
        const timestampKey = 'chatLinkTimestamp_' + (character.id || 'unknown');
        const timestamp = localStorage.getItem(timestampKey);
        
        if (timestamp) {
          chatsWithTimestamps.push({
            character: character,
            timestamp: new Date(timestamp)
          });
        }
      });

      // Sort by most recent first
      this.lastChattedCharacters = chatsWithTimestamps.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
      
      // Filter for active characters that have never been chatted with, excluding side characters
      const activeNonSide = pipe.transform(characters, {
        status: { active: true },
        exclude: { statuses: ['active side'] }
      });
      
      this.neverChattedCharacters = activeNonSide.filter(char => {
        const timestampKey = 'chatLinkTimestamp_' + (char.id || 'unknown');
        return !localStorage.getItem(timestampKey);
      });
    });
  }

  onCharacterClick(character: Character) {
    this.selectedCharacter = character;
  }
}
