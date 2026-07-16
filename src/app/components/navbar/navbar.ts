import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DeviceService } from '../../services/device.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  isMenuOpen = false;
  openCategory: 'groupings' | 'management' | 'fun' | 'other' | null = null;

  constructor(private deviceService: DeviceService) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;

    if (!this.isMenuOpen) {
      this.openCategory = null;
    }
  }

  toggleCategory(category: 'groupings' | 'management' | 'fun' | 'other') {
    this.openCategory = this.openCategory === category ? null : category;
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.openCategory = null;
  }

  isMobile(): boolean {
    return this.deviceService.isMobile();
  }
}
