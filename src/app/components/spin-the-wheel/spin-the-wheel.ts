// ...existing code...
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterService, Character } from '../../services/character.service';


@Component({
  selector: 'app-spin-the-wheel',
  templateUrl: './spin-the-wheel.html',
  styleUrl: './spin-the-wheel.scss',
  imports: [CommonModule, FormsModule],
  standalone: true
})

export class SpinTheWheel {
  spotlightIndex: number | null = null;
  characters: Character[] = [];
  filteredCharacters: Character[] = [];
  selectedFilter: string = 'all';
  spinning = false;
  selectedCharacter: Character | null = null;
  wheelRotation = 0;
  wheelSize = Math.min(window.innerWidth, 700); // Responsive, max 700px

  constructor(private characterService: CharacterService) {}

  ngOnInit() {
    this.characterService.getCharacters().subscribe(chars => {
      this.characters = chars;
      this.applyFilter();
    });
    window.addEventListener('resize', this.updateWheelSize);
    this.updateWheelSize();
  }
  ngOnChanges() {
    this.applyFilter();
  }

  ngDoCheck() {
    this.applyFilter();
  }

  applyFilter() {
    switch (this.selectedFilter) {
      case 'active':
        this.filteredCharacters = this.characters.filter(c => c.type === 'active');
        break;
      case 'active-semi':
        this.filteredCharacters = this.characters.filter(c => c.type === 'active' || c.type === 'semi-active');
        break;
      case 'active-semi-retired':
        this.filteredCharacters = this.characters.filter(c => ['active', 'semi-active', 'retired'].includes(c.type));
        break;
      case 'active-semi-retired-side':
        this.filteredCharacters = this.characters.filter(c => ['active', 'semi-active', 'retired', 'side'].includes(c.type));
        break;
      default:
        this.filteredCharacters = this.characters.filter(c => c.type !== 'me');
    }
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.updateWheelSize);
  }

  updateWheelSize = () => {
    this.wheelSize = Math.min(window.innerWidth - 40, 700);
  }

  spinWheel() {
    if (this.spinning || this.filteredCharacters.length === 0) return;
    this.spinning = true;
    this.selectedCharacter = null;
    this.spotlightIndex = null;
    const total = this.filteredCharacters.length;
    const rounds = 12; // how many spotlights before stopping
    let current = 0;
    let interval = 120;
    const indices: number[] = [];
    for (let i = 0; i < rounds; i++) {
      indices.push(Math.floor(Math.random() * total));
    }
    // Final index to select
    const finalIndex = Math.floor(Math.random() * total);
    indices.push(finalIndex);

    const spotlightStep = () => {
      if (current < indices.length) {
        this.spotlightIndex = indices[current];
        current++;
        interval = Math.min(300, interval + 20); // slow down
        setTimeout(spotlightStep, interval);
      } else {
        this.selectedCharacter = this.filteredCharacters[finalIndex];
        this.spotlightIndex = null;
        this.spinning = false;
      }
    };
    spotlightStep();
  }

  onWheelClick() {
    if (!this.spinning) {
      this.spinWheel();
    }
  }

  // SVG helpers
  getSlicePath(i: number, total: number, cx: number, cy: number, r: number): string {
    const angle = (2 * Math.PI) / total;
    const startAngle = i * angle - Math.PI / 2;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`;
  }

  getSliceColor(i: number): string {
    // Alternate colors for slices
    const colors = ["#f7b731", "#4a90e2", "#e74c3c", "#27ae60", "#9b59b6", "#f1c40f", "#16a085", "#e67e22"];
    return colors[i % colors.length];
  }

  getTextX(i: number, total: number, cx: number, r: number): number {
    const angle = ((i + 0.5) * 2 * Math.PI) / total - Math.PI / 2;
    return cx + r * Math.cos(angle);
  }

  getTextY(i: number, total: number, cy: number, r: number): number {
    const angle = ((i + 0.5) * 2 * Math.PI) / total - Math.PI / 2;
    return cy + r * Math.sin(angle);
  }

  getTextRotation(i: number, total: number, cx: number, r: number): string {
    const angleDeg = ((i + 0.5) * 360) / total - 90;
    const x = this.getTextX(i, total, cx, r);
    const y = this.getTextY(i, total, cx, r);
    return `rotate(${angleDeg} ${x} ${y})`;
  }

  getImageSize(sliceCount: number, wheelSize: number): number {
    // Images grow when there are fewer slices
    const minSize = 30;
    const maxSize = 120;
    sliceCount = sliceCount || 1;
    wheelSize = wheelSize || 400;
    // Calculate arc length of slice at radius (wheelSize/2 - 90)
    const radius = wheelSize / 2 - 90;
    const arcLength = (2 * Math.PI * radius) / sliceCount;
    // Image size should fit comfortably within the slice arc
    const size = Math.max(minSize, Math.min(maxSize, Math.floor(arcLength * 0.7)));
    return size;
  }

  getImageRadius(sliceCount: number, wheelSize: number): number {
    // For fewer slices, push images further in; for more slices, closer to edge
  const minRadius = wheelSize / 2 - 180; // furthest in (more towards center)
  const maxRadius = wheelSize / 2 - 70;  // closer to edge, but still further in
    sliceCount = sliceCount || 1;
    // Interpolate radius: more slices = closer to edge
    // Clamp sliceCount between 2 and 20 for interpolation
    const clamped = Math.max(2, Math.min(20, sliceCount));
    // Linear interpolation
    const t = (clamped - 2) / (20 - 2);
    return minRadius + t * (maxRadius - minRadius);
  }
}
