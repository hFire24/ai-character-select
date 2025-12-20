import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Character, CharacterService } from '../../services/character.service';
import { BackButton } from '../back-button/back-button';

@Component({
  selector: 'app-story-helper',
  imports: [FormsModule, BackButton],
  templateUrl: './story-helper.html',
  styleUrl: './story-helper.scss'
})
export class StoryHelper {
  originalPrompt: string = '';
  placeholderNumber: number = 1;
  characters: Character[] = [];
  characterList: string[] = [];
  private _charactersString: string = '';
  excludeRetired: boolean = false;
  dateString: string = '';
  timeString: string = '';
  time: Date = new Date();
  duration: string = '1 hour';
  durationInMinutes: number = 60;

  constructor(
    private characterService: CharacterService,
  ) {}

  get charactersString(): string {
    return this._charactersString;
  }

  set charactersString(value: string) {
    this._charactersString = value;
    this.updateCharacterList();
  }

  private updateCharacterList(): void {
    if (this._charactersString.trim() === '') {
      this.characterList = [];
    } else {
      this.characterList = this._charactersString
        .split(',')
        .map(char => char.trim())
        .filter(char => char !== '');
    }
  }

  get processedPrompt(): string {
    return this.generateProcessedPrompt();
  }

  private generateProcessedPrompt(): string {
    const parts: string[] = [];
    
    let promptText = this.originalPrompt.trim();
    
    // Replace {1}, {2}, {3}, etc. with actual character names
    if (promptText && this.characterList.length > 0) {
      this.characterList.forEach((character, index) => {
        const placeholder = `{${index + 1}}`;
        promptText = promptText.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), character);
      });
    }
    
    if (promptText) {
      parts.push(promptText);
    }
    
    if (this.dateString.trim()) {
      parts.push(`Date: ${this.dateString.trim()}`);
    }
    
    if (this.timeString.trim()) {
      parts.push(`Time: ${this.timeString.trim()}`);
    }
    
    if (this.duration.trim()) {
      parts.push(`Duration: ${this.duration.trim()}`);
    }
    
    return parts.join('\n');
  }

  ngOnInit() {
    this.fillDate();
    this.characterService.getCharacters().subscribe(chars => {
      const maxTier = Math.max(...chars.map(c => c.tier || 0));
      this.characters = chars.filter(c => (c.tier || 0) < maxTier && c.id !== 71);
    });
  }

  insertPlaceholder() {
    const placeholder = `{${this.placeholderNumber}}`;
    const cursorPos = this.originalPrompt.length; 
    this.originalPrompt = this.originalPrompt.slice(0, cursorPos) + placeholder + this.originalPrompt.slice(cursorPos);
    this.placeholderNumber++;
  }

  generateCharacter() {
    if (this.characters.length === 0) return;
    const filteredCharacters = this.excludeRetired ? this.characters.filter(c => !c.type.includes('retired')) : this.characters;
    if (filteredCharacters.length === 0) return;

    let random = Math.floor(Math.random() * filteredCharacters.length);

    const character = filteredCharacters[random];
    this.characterList.push(character.shortName);
    this.charactersString = this.characterList.join(', ');
  }

  fillDate() {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const dayNames = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ];
    const fullMonth = monthNames[this.time.getMonth()];
    const dayName = dayNames[this.time.getDay()];
    this.dateString = `${dayName}, ${fullMonth}`;
  }

  updateDuration($event: Event) {
    const input = $event.target as HTMLInputElement;
    const minutes = parseInt(input.value, 10);
    this.durationInMinutes = minutes;
    if (minutes <= 60) {
      this.duration = `${minutes} minutes`;
    } else if (minutes < 120) {
      const hours = Math.floor((minutes - 55) / 5);
      this.duration = `${hours} hours`;
    } else {
      this.duration = "1 day";
    }
  }

  randomizeDuration() {
    const randomMinutes = Math.floor(Math.random() * 120 / 5) * 5 + 5; // Random between 5 and 120
    this.durationInMinutes = randomMinutes;
    this.updateDuration({ target: { value: randomMinutes } } as unknown as Event);
  }

  randomizeTime() {
    function getRandomTime() {
      const hour = Math.floor(Math.random() * 12) + 1; // Random hour between 1 and 12
      const minute = 0;
      const period = Math.random() < 0.5 ? 'AM' : 'PM'; // Randomly choose AM or PM
      const formattedMinute = minute < 10 ? `0${minute}` : minute; // Ensure two digits for minutes
      return `${hour}:${formattedMinute} ${period}`;
    }

    const randomTime = getRandomTime();
    this.timeString = randomTime;
  }

  getCurrentTime() {
    let hours = this.time.getHours();
    const minutes = this.time.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format
    const formattedMinute = minutes < 10 ? `0${minutes}` : minutes; // Ensure two digits for minutes
    this.timeString = `${hours}:${formattedMinute} ${period}`;
  }

  copyToClipboard() {
    const promptText = this.processedPrompt;
    navigator.clipboard.writeText(promptText).then(() => {
      alert('Prompt copied to clipboard');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      alert('Failed to copy prompt to clipboard');
    });
  }

  clear() {
    this.originalPrompt = '';
    this.characterList = [];
    this.charactersString = '';
    this.dateString = '';
    this.timeString = '';
    this.duration = '1 hour';
    this.durationInMinutes = 60;
    this.fillDate();
  }
}
