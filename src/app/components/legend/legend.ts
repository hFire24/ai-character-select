import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderButtons } from '../header-buttons/header-buttons';
import { Mood } from '../../services/mood.service';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-legend',
  imports: [CommonModule, HeaderButtons],
  templateUrl: './legend.html',
  styleUrl: './legend.scss'
})
export class Legend implements OnInit {
  @Input() showMoreCharacters = false;
  @Output() selectMood = new EventEmitter<Mood>();
  isCollapsed = false;
  selectedMood: Mood | null = null;

  constructor(private deviceService: DeviceService) {}

  ngOnInit() {
    // Check if device is mobile and collapse legend by default
    this.isCollapsed = this.deviceService.isPhone();
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  onMoodSelected(mood: Mood) {
    this.selectedMood = mood;
    this.selectMood.emit(mood);
  }
}
