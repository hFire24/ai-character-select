import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterService, Character } from '../../services/character.service';

@Component({
  selector: 'app-birthday-banner',
  imports: [CommonModule],
  templateUrl: 'birthday-banner.html',
  styleUrl: 'birthday-banner.scss'
})
export class BirthdayBanner implements OnInit {
  @Output() selectCharacter = new EventEmitter<Character>();
  
  birthdayCharacters: Character[] = [];
  showBanner = false;
  showDismissOptions = false;

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    this.checkBirthdays();
  }

  checkBirthdays() {
    const today = new Date();
    const todayMonth = today.toLocaleString('en-US', { month: 'long' });
    const todayDay = today.getDate();

    // Check if we should show the banner based on dismissal preferences
    const dismissalType = localStorage.getItem('birthdayBannerDismissal');
    const dismissalDate = localStorage.getItem('birthdayBannerDismissalDate');
    const todayString = today.toDateString();

    if (dismissalType === 'today' && dismissalDate === todayString) {
      // Dismissed for the rest of today
      return;
    }

    this.characterService.getCharacters().subscribe((characters: Character[]) => {
      this.birthdayCharacters = characters.filter(char => {
        if (!char.birthday || char.type === 'retired') return false;
        
        const [month, day] = char.birthday.split(' ');
        const charDay = parseInt(day);
        
        return month === todayMonth && charDay === todayDay;
      });

      if (this.birthdayCharacters.length > 0) {
        this.showBanner = true;
      }
    });
  }

  toggleDismissOptions() {
    this.showDismissOptions = !this.showDismissOptions;
  }

  remindLater() {
    // Just close the banner, it will show again next session
    this.showBanner = false;
    this.showDismissOptions = false;
  }

  dismissForToday() {
    const today = new Date();
    localStorage.setItem('birthdayBannerDismissal', 'today');
    localStorage.setItem('birthdayBannerDismissalDate', today.toDateString());
    this.showBanner = false;
    this.showDismissOptions = false;
  }

  onCharacterClick(character: Character) {
    this.selectCharacter.emit(character);
  }

  getBirthdayMessage(): string {
    if (this.birthdayCharacters.length === 0) return '';
    
    if (this.birthdayCharacters.length === 1) {
      return `🎉 It's ${this.birthdayCharacters[0].shortName}'s birthday today!`;
    } else if (this.birthdayCharacters.length === 2) {
      return `🎉 It's ${this.birthdayCharacters[0].shortName} and ${this.birthdayCharacters[1].shortName}'s birthday today!`;
    } else {
      const names = this.birthdayCharacters.map(c => c.shortName);
      const lastNameIndex = names.length - 1;
      const allButLast = names.slice(0, lastNameIndex).join(', ');
      return `🎉 It's ${allButLast}, and ${names[lastNameIndex]}'s birthday today!`;
    }
  }
}
