import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tier-screenshot',
  imports: [CommonModule],
  templateUrl: './tier-screenshot.html',
  styleUrl: './tier-screenshot.scss'
})
export class TierScreenshot {

  @Input() screenshotDataUrl: string | null = null;

}
