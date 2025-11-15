import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-footer-buttons',
  imports: [CommonModule, RouterLink],
  templateUrl: './footer-buttons.html',
  styleUrl: './footer-buttons.scss'
})
export class FooterButtons {
  @Input() searchTerm = '';
  @Output() toggleMore = new EventEmitter<void>();
  
  constructor(private deviceService: DeviceService) {}
  
  isMobile(): boolean {
    return this.deviceService.isMobile();
  }
}
