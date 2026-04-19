import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterService, Character } from '../../services/character.service';

@Component({
  selector: 'app-id-checker',
  imports: [CommonModule, FormsModule],
  templateUrl: './id-checker.html',
  styleUrl: './id-checker.scss'
})
export class IdChecker {
  searchId: string = '';
  character: Character | null = null;
  notFound: boolean = false;
  searched: boolean = false;

  constructor(private characterService: CharacterService) {}

  searchById() {
    const id = parseInt(this.searchId);
    
    if (isNaN(id)) {
      this.notFound = true;
      this.character = null;
      this.searched = true;
      return;
    }

    this.characterService.getCharacter(id).subscribe((char) => {
      if (char) {
        this.character = char;
        this.notFound = false;
        this.searched = true;
      } else {
        this.character = null;
        this.notFound = true;
        this.searched = true;
      }
    });
  }

  clearSearch() {
    this.searchId = '';
    this.character = null;
    this.notFound = false;
    this.searched = false;
  }

  onEnter(event: Event) {
    event.preventDefault();
    this.searchById();
  }
}
