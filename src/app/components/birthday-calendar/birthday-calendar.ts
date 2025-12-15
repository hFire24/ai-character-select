import { Component, OnInit } from '@angular/core';
import { Character, CharacterService } from '../../services/character.service';
import { DeviceService } from '../../services/device.service';
import { CharacterModal } from '../character-modal/character-modal';
import { BackButton } from '../back-button/back-button';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  characters: Character[];
}

interface BirthdayCharacter {
  character: Character;
  daysUntilBirthday: number;
  birthDate: Date;
}

@Component({
  selector: 'app-birthday-calendar',
  imports: [CommonModule, CharacterModal, BackButton],
  templateUrl: './birthday-calendar.html',
  styleUrl: './birthday-calendar.scss'
})
export class BirthdayCalendar implements OnInit {
  characters: Character[] = [];
  originalCharacters: Character[] = []; // Store original characters for modal display
  viewMode: 'calendar' | 'list';
  currentDate = new Date();
  selectedCharacter: Character | null = null;
  
  // Calendar view properties
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  calendarDays: CalendarDay[] = [];
  
  // List view properties
  sortedBirthdayCharacters: BirthdayCharacter[] = [];

  constructor(
    private characterService: CharacterService,
    private deviceService: DeviceService
  ) {
    this.viewMode = this.deviceService.isPhone() ? 'list' : 'calendar';
  }

  ngOnInit() {
    this.loadCharacters();
  }

  isSmallMobile(): boolean {
    return this.deviceService.isPhone();
  }

  loadCharacters() {
    this.characterService.getCharactersSplitTwins().subscribe(characters => {     
      this.characters = characters.filter(char => char.birthday && char.birthday.toLowerCase() !== 'unknown');
      this.generateCalendar();
      this.generateSortedList();
    });
  }

  toggleView() {
    // Prevent small mobile devices from accessing calendar view
    if (this.deviceService.isPhone() && this.viewMode === 'list') {
      return; // Do nothing, stay in list view
    }
    this.viewMode = this.viewMode === 'calendar' ? 'list' : 'calendar';
  }

  // Calendar view methods
  generateCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const allDays: CalendarDay[] = [];
    const today = new Date();
    
    // Generate all 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === this.currentMonth;
      const isToday = date.toDateString() === today.toDateString();
      const charactersOnThisDay = this.getCharactersForDate(date);
      
      allDays.push({
        date: date.getDate(),
        isCurrentMonth,
        isToday,
        characters: charactersOnThisDay
      });
    }

    // Filter out rows where all 7 days are from other months
    this.calendarDays = [];
    for (let week = 0; week < 6; week++) {
      const weekStart = week * 7;
      const weekDays = allDays.slice(weekStart, weekStart + 7);
      
      // Check if any day in this week belongs to the current month
      const hasCurrentMonthDay = weekDays.some(day => day.isCurrentMonth);
      
      if (hasCurrentMonthDay) {
        this.calendarDays.push(...weekDays);
      }
    }
  }

  getCharactersForDate(date: Date): Character[] {
    return this.characters.filter(character => {
      if (!character.birthday) return false;
      const birthday = this.parseBirthday(character.birthday);
      return birthday.getMonth() === date.getMonth() && birthday.getDate() === date.getDate();
    });
  }

  navigateMonth(direction: number) {
    this.currentMonth += direction;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  // List view methods
  generateSortedList() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const birthdayCharacters: BirthdayCharacter[] = [];

    this.characters.forEach(character => {
      if (!character.birthday) return;
      
      const birthday = this.parseBirthday(character.birthday);
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      thisYearBirthday.setHours(0, 0, 0, 0); // Normalize to start of day
      
      let daysUntilBirthday: number;
      
      // Check if today is the birthday
      if (thisYearBirthday.getTime() === today.getTime()) {
        daysUntilBirthday = 0;
      } else if (thisYearBirthday < today) {
        // Birthday has passed this year, calculate days until next year's birthday
        const nextYearBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate());
        daysUntilBirthday = Math.ceil((nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        // Birthday is coming up this year
        daysUntilBirthday = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      birthdayCharacters.push({
        character,
        daysUntilBirthday,
        birthDate: birthday
      });
    });

    // Sort by days until birthday (ascending)
    this.sortedBirthdayCharacters = birthdayCharacters.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
  }

  parseBirthday(birthday: string): Date {
    // Parse birthday string like "February 17" or "May 7"
    const [month, day] = birthday.split(' ');
    const monthIndex = this.monthNames.findIndex(m => m.toLowerCase() === month.toLowerCase());
    return new Date(2000, monthIndex, parseInt(day)); // Using 2000 as a dummy year
  }

  openCharacterModal(character: Character) {
    // If it's Liam or Kieran, show the original combined character
    if (character.shortName === 'Liam' || character.shortName === 'Kieran') {
      const originalLiamKieran = this.originalCharacters.find(char => char.shortName === 'Liam & Kieran');
      if (originalLiamKieran) {
        this.selectedCharacter = originalLiamKieran;
      } else {
        this.selectedCharacter = character;
      }
    } else {
      this.selectedCharacter = character;
    }
  }

  closeCharacterModal() {
    this.selectedCharacter = null;
  }

  formatDaysUntilBirthday(days: number, character: Character): string {
    if (days === 0) {
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
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  }
}
