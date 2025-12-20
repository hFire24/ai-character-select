import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-activities',
  imports: [CommonModule, RouterLink],
  templateUrl: './activities.html',
  styleUrl: './activities.scss'
})
export class Activities implements OnInit {
  isCollapsed = false;

  constructor(private deviceService: DeviceService) {}

  ngOnInit() {
    // Check if device is mobile and collapse activities by default
    this.isCollapsed = this.deviceService.isPhone();
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
  
  isIOS(): boolean {
    return this.deviceService.isIOS();
  }
}
