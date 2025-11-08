import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule, CommonModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss'
})
export class SearchBar {
  @Output() searchChange = new EventEmitter<string>();
  searchTerm = '';

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchChange.emit(this.searchTerm);
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchChange.emit(this.searchTerm);
  }
}
