import { Pipe, PipeTransform } from '@angular/core';
import { Character } from '../services/character.service';

/**
 * Formats the number of days until a birthday
 * - 0 days: "Today is his/her/their birthday!"
 * - 1 day: "Tomorrow"
 * - Other: "X days"
 */
@Pipe({
  name: 'daysUntilBirthday',
  standalone: true
})
export class DaysUntilBirthdayPipe implements PipeTransform {
  transform(days: number, character?: Character): string {
    if (days === 0) {
      if (character) {
        const pronoun = character.pronouns?.toLowerCase() || 'their';
        let possessivePronoun: string;
        
        if (pronoun.includes('he/him')) {
          possessivePronoun = 'his';
        } else if (pronoun.includes('she/her')) {
          possessivePronoun = 'her';
        } else {
          possessivePronoun = 'their';
        }
        
        return `Today is ${possessivePronoun} birthday!`;
      }
      return 'Today!';
    }
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  }
}
