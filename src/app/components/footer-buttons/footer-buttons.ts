import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-footer-buttons',
  imports: [CommonModule],
  templateUrl: './footer-buttons.html',
  styleUrl: './footer-buttons.scss'
})
export class FooterButtons {
  @Output() toggleMore = new EventEmitter<void>();

  isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);
  }

  async screenshot(elementId: string) {
    const element = document.getElementById(elementId);

    if (element) {
      const originalBackground = element.style.backgroundColor;
      const computedBackground = getComputedStyle(element).backgroundColor;
      element.style.backgroundColor = computedBackground;
      const canvas = await html2canvas(element, {
        backgroundColor: computedBackground,
        scale: 2 // Increase scale for better quality
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new window.ClipboardItem({ 'image/png': blob })
            ]);
            alert('Screenshot copied to clipboard!');
          } catch (err) {
            alert('Failed to copy screenshot to clipboard.');
          }
        }
        // Unhide close button and modal footer
        element.style.backgroundColor = originalBackground; // Restore original background
      }, 'image/png');
    }
  }
}
