import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tier-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './tier-settings.html',
  styleUrl: './tier-settings.scss'
})
export class TierSettings {
  @Input() tierCount: number = 1;
  colorOptions = [
    { name: 'Red', value: '#FF7F7E' },
    { name: 'Orange', value: '#FFBF7F' },
    { name: 'Light Orange', value: '#FFDF80' },
    { name: 'Yellow', value: '#FEFF7F' },
    { name: 'Yellow-Green', value: '#BEFF7F' },
    { name: 'Green', value: '#7EFF80' },
    { name: 'Light Cyan', value: '#7FFFFF' },
    { name: 'Light Blue', value: '#7FBFFF' },
    { name: 'Blue', value: '#807FFF' },
    { name: 'Purple', value: '#BF7FBE' },
    { name: 'Pink', value: '#FF7FFE' },
    { name: 'Gray', value: '#858585' },
    { name: 'Silver', value: '#CFCFCF' },
    { name: 'White', value: '#F7F7F7' },
  ];
  @Output() newTierAbove = new EventEmitter<void>();
  @Output() newTierBelow = new EventEmitter<void>();

  onNewTierAbove() {
    this.newTierAbove.emit();
  }

  onNewTierBelow() {
    this.newTierBelow.emit();
  }
  @Input() tierName: string = '';
  @Input() tierColor: string = '';

  @Output() save = new EventEmitter<{ name: string; color: string }>();
  @Output() cancel = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  editedName: string = '';
  editedColor: string = '';

  ngOnInit() {
    this.editedName = this.tierName;
    this.editedColor = this.tierColor;
  }

  ngOnChanges() {
    this.editedName = this.tierName;
    this.editedColor = this.tierColor;
  }

  onSave() {
    this.save.emit({ name: this.editedName, color: this.editedColor });
  }

  onColorChange(color: { name: string; value: string }) {
    this.editedColor = color.value;
    this.onSave();
  }

  onCancel() {
    this.cancel.emit();
  }

  onDelete() {
    this.delete.emit();
  }
}
