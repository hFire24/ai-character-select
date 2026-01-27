import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from './services/character.service';
import { Mood } from './services/mood.service';
import { RouterOutlet } from '@angular/router';
import { DeviceService } from './services/device.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private deviceService = inject(DeviceService);
  
  showMoreCharacters = false;
  selectedCharacter: Character | null = null;
  selectedMood: Mood | null = null;

  ngOnInit() {
    // Add iOS class to body if on iOS device
    if (this.deviceService.isIOS()) {
      document.body.classList.add('ios-device');
    }
  }

  toggleCharacters() {
    this.showMoreCharacters = !this.showMoreCharacters;
    window.scrollTo({ top: 0 });
  }

  displayCharacter() {
    this.selectedCharacter = this.selectedCharacter; // Trigger modal display
  }

  openTierList() {
    // Logic to open the tier list modal
  }
}