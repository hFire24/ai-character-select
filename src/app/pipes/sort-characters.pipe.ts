import { Pipe, PipeTransform } from '@angular/core';
import { Character } from '../services/character.service';

export type SortField = 'none' | 'id' | 'name' | 'shortName' | 'status' | 'generation' | 'tier' | 'moe' | 'futuristic' | 'birthday' | 'creationDate';
export type SortDirection = 'asc' | 'desc';

@Pipe({
  name: 'sortCharacters',
  standalone: true,
  pure: true
})
export class SortCharactersPipe implements PipeTransform {
  transform(
    characters: Character[], 
    field: SortField = 'none', 
    direction: SortDirection = 'asc'
  ): Character[] {
    if (!characters || characters.length === 0) {
      return characters;
    }

    // If no sorting is selected, return characters in original order
    if (field === 'none') {
      return characters;
    }

    const sorted = [...characters].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (field) {
        case 'id':
          valueA = a.id;
          valueB = b.id;
          break;
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'shortName':
          valueA = a.shortName.toLowerCase();
          valueB = b.shortName.toLowerCase();
          break;
        case 'status':
          // Custom status order: active, inactive, retired, side, inactive side, retired side, everything else
          const statusOrder: { [key: string]: number } = {
            'active': 1,
            'inactive': 2,
            'retired': 3,
            'side': 4,
            'inactive side': 5,
            'retired side': 6
          };
          valueA = statusOrder[a.status.toLowerCase()] || 999;
          valueB = statusOrder[b.status.toLowerCase()] || 999;
          break;
        case 'generation':
          valueA = a.generation;
          valueB = b.generation;
          break;
        case 'tier':
          valueA = a.tier;
          valueB = b.tier;
          break;
        case 'moe':
          valueA = a.moe;
          valueB = b.moe;
          break;
        case 'futuristic':
          valueA = a.futuristic;
          valueB = b.futuristic;
          break;
        case 'birthday':
          valueA = a.birthday || '';
          valueB = b.birthday || '';
          break;
        case 'creationDate':
          valueA = a.creationDate || '';
          valueB = b.creationDate || '';
          break;
        default:
          valueA = a.id;
          valueB = b.id;
      }

      // Handle null/undefined values
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return 1;
      if (valueB == null) return -1;

      // Compare values
      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }
}
