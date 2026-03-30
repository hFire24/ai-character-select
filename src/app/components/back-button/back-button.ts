import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './back-button.html',
  styleUrl: './back-button.scss'
})
export class BackButton {
  @Input() customStyles: { [key: string]: string } = {};
  @Input() route: string = '/';
  @Input() text: string = 'Back to Character Select';
  
  constructor(private router: Router) {}

  onClick() {
    this.router.navigate([this.route]);
  }
}
