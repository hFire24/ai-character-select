import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DeviceService } from './device.service';
import { Character } from './character.service';
import { CharacterFilterPipe, CharacterFilterOptions } from '../pipes/character-filter.pipe';
import { getStoredChatLink } from '../utils/chat-link-storage';
import { MOE_THRESHOLD, NON_MOE_THRESHOLD } from '../config/character-thresholds';

export type Mood = {
  name: string;
  emoji: string;
  arg: string;
  selectable: boolean;
  description?: string;
  color?: string; // Optional field for mood color
}

export interface MoodCharacterOptions {
  showInactive?: boolean;
  showRetired?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MoodService {
  constructor(private http: HttpClient, private deviceService: DeviceService) {}

  getMoods(): Observable<Mood[]> {
    return this.http.get<Mood[]>('assets/data/moods.json').pipe(
      map(moods => this.filterMoodsForMobile(moods.filter(mood => mood.selectable === true)))
    );
  }

  private getStatusFilter(options: MoodCharacterOptions): CharacterFilterOptions['status'] {
    const statusFilter: NonNullable<CharacterFilterOptions['status']> = { active: true };
    if (options.showInactive) {
      statusFilter.inactive = true;
    }
    if (options.showRetired) {
      statusFilter.retired = true;
    }
    return statusFilter;
  }

  private hasActiveChat(character: Character): boolean {
    return getStoredChatLink(character) !== null;
  }

  private getFilterOptions(mood: Mood, options: MoodCharacterOptions): CharacterFilterOptions {
    const baseOptions: CharacterFilterOptions = {
      status: this.getStatusFilter(options),
      tier: { max: 8 } // tier < 9
    };

    switch (mood.arg) {
      case 'moe':
        return {
          ...baseOptions,
          customFilter: (c: Character) => c.moe >= MOE_THRESHOLD || c.color === 'pink'
        };
      case 'knowledge':
        return {
          ...baseOptions,
          knowledgeFriendly: true
        };
      case 'rp':
        return {
          ...baseOptions,
          rpFriendly: true
        };
      case 'futuristic':
        return {
          ...baseOptions,
          attributes: { futuristic: { min: 7 } }
        };
      case 'traditional':
        return {
          ...baseOptions,
          attributes: { futuristic: { max: 4 } }
        };
      case 'immature':
        return {
          ...baseOptions,
          attributes: { mature: { max: 3 } }
        };
      case 'mature':
        return {
          ...baseOptions,
          attributes: { mature: { min: 9 } }
        };
      case 'male':
        return {
          ...baseOptions,
          attributes: { pronouns: ['he/him'] }
        };
      case 'female':
        return {
          ...baseOptions,
          attributes: { pronouns: ['she/her'] }
        };
      case 'moe0':
        return {
          ...baseOptions,
          attributes: { moe: { max: NON_MOE_THRESHOLD } }
        };
      case 'chatted':
        return {
          activeChats: true,
          customFilter: (c: Character) => !c.status.includes('side')
        };
      case 'chatted0':
        return {
          ...baseOptions,
          customFilter: (c: Character) => !this.hasActiveChat(c)
        };
      case 'favorites':
        return {
          tier: { favorite: true } // tier <= 3
        };
      default:
        return {
          ...baseOptions
        };
    }
  }

  filterCharacters(characters: Character[], mood: Mood, options: MoodCharacterOptions = {}): Character[] {
    const pipe = new CharacterFilterPipe();
    const filtered = pipe.transform(characters, this.getFilterOptions(mood, options));
    
    // Special case: favorites should be sorted by tier
    if (mood.arg === 'favorites') {
      return filtered.sort((a, b) => a.tier - b.tier);
    }
    
    return filtered;
  }

  filterCharactersByStatus(characters: Character[], options: MoodCharacterOptions = {}): Character[] {
    return new CharacterFilterPipe().transform(characters, { status: this.getStatusFilter(options) });
  }

  private filterMoodsForMobile(moods: Mood[]): Mood[] {
    const isMobile = this.deviceService.isMobile();
    
    if (isMobile) {
      return moods.filter(mood => 
        mood.name !== 'Has Chat' && mood.name !== 'Not Chatted'
      );
    }
    
    return moods;
  }
}
