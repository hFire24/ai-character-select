import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-text-viewer',
  imports: [],
  templateUrl: './text-viewer.html',
  styleUrl: './text-viewer.scss'
})
export class TextViewer {
  @Input() textContent: string = '';
  copyButtonText: string = 'Copy';

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.textContent);
      this.copyButtonText = 'Copied!';
      setTimeout(() => {
        this.copyButtonText = 'Copy';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      this.copyButtonText = 'Failed';
      setTimeout(() => {
        this.copyButtonText = 'Copy';
      }, 2000);
    }
  }
}
