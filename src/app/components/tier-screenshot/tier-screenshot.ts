import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tier-screenshot',
  imports: [CommonModule],
  templateUrl: './tier-screenshot.html',
  styleUrl: './tier-screenshot.scss'
})
export class TierScreenshot {

  @Input() screenshotTitle: string = "Exported Tier List";
  @Input() screenshotDataUrl: string | null = null;

}
