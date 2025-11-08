import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer-buttons',
  imports: [CommonModule, RouterLink],
  templateUrl: './footer-buttons.html',
  styleUrl: './footer-buttons.scss'
})
export class FooterButtons {
  @Input() searchTerm = '';
  @Output() toggleMore = new EventEmitter<void>();
  
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);
  }
}
