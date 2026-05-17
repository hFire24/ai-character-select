import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CharacterFilters } from '../../pipes/character-filter.pipe';
import { DeviceService } from '../../services/device.service';
import { SearchBar } from '../search-bar/search-bar';

type RosterFilterType = 'activeChats' | 'activeNoChats' | 'active' | 'inactive' | 'retired' | 'side';

@Component({
  selector: 'app-roster-filter',
  imports: [SearchBar],
  templateUrl: './roster-filter.html',
  styleUrl: './roster-filter.scss'
})
export class RosterFilter {
  @Input({ required: true }) filters!: CharacterFilters;
  @Input() searchTerm = '';
  @Output() filtersChange = new EventEmitter<CharacterFilters>();
  @Output() searchChange = new EventEmitter<string>();
  isCollapsed = false;

  constructor(private deviceService: DeviceService) {}

  ngOnInit() {
    // Check if device is mobile and collapse legend by default
    this.isCollapsed = this.deviceService.isPhone();
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleFilter(filterType: RosterFilterType) {
    const newFilters = { ...this.filters };

    if (filterType === 'activeChats' || filterType === 'activeNoChats') {
      if (!newFilters[filterType]) {
        newFilters.activeChats = filterType === 'activeChats';
        newFilters.activeNoChats = filterType === 'activeNoChats';
        newFilters.active = false;
        newFilters.inactive = false;
        newFilters.retired = false;
        newFilters.side = false;
      } else {
        newFilters[filterType] = false;
        newFilters.active = true;
      }
    } else {
      newFilters.activeChats = false;
      newFilters.activeNoChats = false;
      newFilters[filterType] = !newFilters[filterType];

      const hasActiveStatusFilter =
        newFilters.active || newFilters.inactive || newFilters.retired || newFilters.side;
      if (!hasActiveStatusFilter) {
        newFilters[filterType] = true;
      }
    }

    this.filtersChange.emit(newFilters);
  }

  onSearchChange(searchTerm: string) {
    this.searchChange.emit(searchTerm);
  }

  isMobileDevice(): boolean {
    return this.deviceService.isMobile();
  }
}
