import { Pipe, PipeTransform } from '@angular/core';
import { Character } from '../services/character.service';
import { getStoredChatLink } from '../utils/chat-link-storage';

// Simple status filter interface (for backwards compatibility)
export interface CharacterFilters {
  activeChats?: boolean;
  activeNoChats?: boolean;
  active: boolean;
  inactive: boolean;
  retired: boolean;
  side: boolean;
}

// Comprehensive filter options interface
export interface CharacterFilterOptions {
  // Active chats filter (characters with active chat links in storage)
  activeChats?: boolean;
  activeNoChats?: boolean;
  
  // Status filters
  status?: {
    active?: boolean;
    inactive?: boolean;
    retired?: boolean;
    side?: boolean;
    me?: boolean;
    future?: boolean;
    bonus?: boolean;
  };
  
  // RP friendly filter
  rpFriendly?: boolean;
  
  // Question friendly filter
  knowledgeFriendly?: boolean;
  
  // Tier filters
  tier?: {
    min?: number;        // Minimum tier (inclusive)
    max?: number;        // Maximum tier (inclusive)
    favorite?: boolean;  // Tier 1-3 only
    exclude?: number[];  // Specific tiers to exclude
  };
  
  // Attribute filters
  attributes?: {
    moe?: { min?: number; max?: number };
    futuristic?: { min?: number; max?: number };
    colors?: string[];   // e.g., ['pink', 'blue', 'red']
    pronouns?: string[]; // e.g., ['he/him', 'she/her']
    musicEnjoyer?: boolean | null; // true = only music enjoyers, false = exclude music enjoyers, null = all
    personalityGirl?: boolean | null; // true = only personality girls, false = exclude personality girls, null = all
    rpFriendly?: boolean | null; // true = only RP friendly, false = exclude RP friendly, null = all
    knowledgeFriendly?: boolean | null; // true = only knowledge friendly, false = exclude knowledge friendly, null = all
  };
  
  // Exclusions
  exclude?: {
    ids?: number[];      // Exclude specific character IDs
    names?: string[];    // Exclude by shortName
    statuses?: string[]; // Exclude specific statuses
  };
  
  // Search term
  search?: string;
  
  // Custom filter function
  customFilter?: (character: Character) => boolean;
}

@Pipe({
  name: 'characterFilter',
  standalone: true,
  pure: true
})
export class CharacterFilterPipe implements PipeTransform {
  transform(
    characters: Character[], 
    filters: CharacterFilters | CharacterFilterOptions, 
    searchTerm: string = ''
  ): Character[] {
    if (!characters || characters.length === 0) {
      return [];
    }

    // Detect which filter interface is being used
    const isSimpleFilter = this.isSimpleFilter(filters);
    
    if (isSimpleFilter) {
      return this.applySimpleFilter(characters, filters as CharacterFilters, searchTerm);
    } else {
      return this.applyAdvancedFilter(characters, filters as CharacterFilterOptions);
    }
  }

  private isSimpleFilter(filters: any): boolean {
    return filters && 
           typeof filters.active === 'boolean' && 
           typeof filters.inactive === 'boolean' && 
           typeof filters.retired === 'boolean' && 
           typeof filters.side === 'boolean';
  }

  private applySimpleFilter(
    characters: Character[], 
    filters: CharacterFilters, 
    searchTerm: string
  ): Character[] {
    // If user is actively searching, show all characters matching the search
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      return characters.filter(character => 
        character.shortName.toLowerCase().includes(searchLower) ||
        character.name.toLowerCase().includes(searchLower)
      );
    }

    // If active chats filter is enabled, only show characters with active chats
    if (filters.activeChats) {
      return characters.filter(character => {
        return this.hasStoredChatLink(character);
      });
    }

    // If active no chats filter is enabled, only show active characters without active chats
    if (filters.activeNoChats) {
      return characters.filter(character =>
        character.status === 'active' && !this.hasStoredChatLink(character)
      );
    }

    // Apply filters based on character status
    return characters.filter(character => {
      if (character.status === 'active' && filters.active) return true;
      if (character.status === 'inactive' && filters.inactive) return true;
      if (character.status === 'retired' && filters.retired) return true;
      
      const isMainCharacter = ['active', 'inactive', 'retired'].includes(character.status);
      if (!isMainCharacter && filters.side) return true;
      
      return false;
    });
  }

  private applyAdvancedFilter(
    characters: Character[], 
    options: CharacterFilterOptions
  ): Character[] {
    return characters.filter(character => {
      // Search filter (takes priority)
      if (options.search && options.search.trim()) {
        const searchLower = options.search.toLowerCase().trim();
        const matchesSearch = 
          character.shortName.toLowerCase().includes(searchLower) ||
          character.name.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
        return true; // If searching, ignore other filters
      }

      // Active chats filter
      if (options.activeChats) {
        if (!this.hasStoredChatLink(character)) return false;
      }

      // Active no chats filter
      if (options.activeNoChats) {
        if (character.status !== 'active' || this.hasStoredChatLink(character)) return false;
      }

      // Status filter
      if (options.status) {
        const statusMatch = this.checkStatus(character, options.status);
        if (!statusMatch) return false;
      }

      // RP Friendly filter
      if (options.rpFriendly === true) {
        if (character.rpFriendly !== true) {
          return false;
        }
      }

      // Question Friendly filter
      if (options.knowledgeFriendly === true) {
        if (character.knowledgeFriendly !== true) {
          return false;
        }
      }

      // Tier filter
      if (options.tier) {
        const tierMatch = this.checkTier(character, options.tier);
        if (!tierMatch) return false;
      }

      // Attribute filters
      if (options.attributes) {
        const attrMatch = this.checkAttributes(character, options.attributes);
        if (!attrMatch) return false;
      }

      // Exclusions
      if (options.exclude) {
        const shouldExclude = this.shouldExclude(character, options.exclude);
        if (shouldExclude) return false;
      }

      // Custom filter function
      if (options.customFilter) {
        return options.customFilter(character);
      }

      return true;
    });
  }

  private checkStatus(character: Character, status: NonNullable<CharacterFilterOptions['status']>): boolean {
    const hasAnyFilter = Object.values(status).some(v => v === true);
    if (!hasAnyFilter) return true; // No status filters active

    const characterStatus = character.status.toLowerCase();
    if (status.active && characterStatus === 'active') return true;
    if (status.inactive && characterStatus === 'inactive') return true;
    if (status.retired && characterStatus === 'retired') return true;
    if (status.side && characterStatus.includes('side')) return true;
    if (status.me && characterStatus === 'me') return true;
    if (status.future && characterStatus === 'future') return true;
    if (status.bonus && characterStatus === 'bonus') return true;
    
    return false;
  }

  private checkTier(character: Character, tier: NonNullable<CharacterFilterOptions['tier']>): boolean {
    const charTier = character.tier || 0;

    if (tier.favorite && (charTier < 1 || charTier > 3)) return false;
    if (tier.min !== undefined && charTier < tier.min) return false;
    if (tier.max !== undefined && charTier > tier.max) return false;
    if (tier.exclude && tier.exclude.includes(charTier)) return false;

    return true;
  }

  private checkAttributes(
    character: Character, 
    attrs: NonNullable<CharacterFilterOptions['attributes']>
  ): boolean {
    // Moe filter
    if (attrs.moe) {
      const charMoe = character.moe || 0;
      if (attrs.moe.min !== undefined && charMoe < attrs.moe.min) return false;
      if (attrs.moe.max !== undefined && charMoe > attrs.moe.max) return false;
    }

    // Futuristic filter
    if (attrs.futuristic) {
      const charFuturistic = character.futuristic || 0;
      if (attrs.futuristic.min !== undefined && charFuturistic < attrs.futuristic.min) return false;
      if (attrs.futuristic.max !== undefined && charFuturistic > attrs.futuristic.max) return false;
    }

    // Color filter
    if (attrs.colors && attrs.colors.length > 0) {
      if (!attrs.colors.includes(character.color)) return false;
    }

    // Pronouns filter
    if (attrs.pronouns && attrs.pronouns.length > 0) {
      if (!attrs.pronouns.includes(character.pronouns)) return false;
    }

    // Music enjoyer filter
    if (attrs.musicEnjoyer !== undefined && attrs.musicEnjoyer !== null) {
      if (attrs.musicEnjoyer && !character.musicEnjoyer) return false;
      if (!attrs.musicEnjoyer && character.musicEnjoyer) return false;
    }

    // Personality girl filter
    if (attrs.personalityGirl !== undefined && attrs.personalityGirl !== null) {
      if (attrs.personalityGirl && !character.personalityGirl) return false;
      if (!attrs.personalityGirl && character.personalityGirl) return false;
    }

    // RP friendly filter
    if (attrs.rpFriendly !== undefined && attrs.rpFriendly !== null) {
      if (attrs.rpFriendly && !character.rpFriendly) return false;
      if (!attrs.rpFriendly && character.rpFriendly) return false;
    }

    // Knowledge friendly filter
    if (attrs.knowledgeFriendly !== undefined && attrs.knowledgeFriendly !== null) {
      if (attrs.knowledgeFriendly && !character.knowledgeFriendly) return false;
      if (!attrs.knowledgeFriendly && character.knowledgeFriendly) return false;
    }

    return true;
  }

  private shouldExclude(
    character: Character, 
    exclude: NonNullable<CharacterFilterOptions['exclude']>
  ): boolean {
    if (exclude.ids && exclude.ids.includes(character.id)) return true;
    if (exclude.names && exclude.names.includes(character.shortName)) return true;
    if (exclude.statuses && exclude.statuses.includes(character.status)) return true;
    
    return false;
  }

  private hasStoredChatLink(character: Character): boolean {
    return getStoredChatLink(character) !== null;
  }
}
