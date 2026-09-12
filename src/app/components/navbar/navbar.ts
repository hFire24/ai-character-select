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
  hoveredMenu: 'groupings' | 'management' | 'fun' | 'other' | null = null;
  suppressedMenu: 'groupings' | 'management' | 'fun' | 'other' | null = null;


  constructor(private deviceService: DeviceService) {}

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;

    if (!this.isMenuOpen) {
      this.openCategory = null;
      this.hoveredMenu = null;
      this.suppressedMenu = null;
    }
  }

  toggleCategory(menu: 'groupings' | 'management' | 'fun' | 'other') {
    if (this.openCategory === menu) {
      this.openCategory = null;
      this.suppressedMenu = menu;
    } else {
      this.openCategory = menu;
      this.suppressedMenu = null;
    }
  }

  isCategoryOpen(menu: 'groupings' | 'management' | 'fun' | 'other'): boolean {
    return this.openCategory === menu ||
      (this.hoveredMenu === menu && this.suppressedMenu !== menu);
  }

  enterMenu(menu: 'groupings' | 'management' | 'fun' | 'other', event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.hoveredMenu = menu;
  }

  leaveMenu(menu: 'groupings' | 'management' | 'fun' | 'other'): void {
    if (this.hoveredMenu === menu) this.hoveredMenu = null;
    if (this.suppressedMenu === menu) this.suppressedMenu = null;
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.openCategory = null;
    this.suppressedMenu = this.hoveredMenu;
  }

  isMobile(): boolean {
    return this.deviceService.isMobile();
  }
}
