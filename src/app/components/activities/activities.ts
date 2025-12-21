import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-activities',
  imports: [CommonModule, RouterLink],
  templateUrl: './activities.html',
  styleUrl: './activities.scss'
})
export class Activities {
  isCollapsed = true;

  constructor(private deviceService: DeviceService) {}  

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
  
  isIOS(): boolean {
    return this.deviceService.isIOS();
  }
}
