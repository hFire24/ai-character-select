import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CharacterFilters } from '../../pipes/character-filter.pipe';
import { DeviceService } from '../../services/device.service';
import { SearchBar } from '../search-bar/search-bar';

type RosterFilterType = 'activeChats' | 'activeNoChats' | 'active' | 'inactive' | 'retired' | 'superRetired' | 'side';

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
  activeDropdown: 'status' | 'purpose' | 'gender' | null = null;
  private closeDropdownTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private deviceService: DeviceService) {}

  ngOnInit() {
    // Check if device is mobile and collapse legend by default
    this.isCollapsed = this.deviceService.isPhone();
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    if (this.isCollapsed) this.activeDropdown = null;
  }

  showDropdown(dropdown: 'status' | 'purpose' | 'gender') {
    if (this.closeDropdownTimer) {
      clearTimeout(this.closeDropdownTimer);
      this.closeDropdownTimer = null;
    }
    this.activeDropdown = dropdown;
  }

  hoverDropdown(dropdown: 'status' | 'purpose' | 'gender') {
    if (!this.deviceService.isMobile()) this.showDropdown(dropdown);
  }

  toggleDropdown(dropdown: 'status' | 'purpose' | 'gender') {
    if (this.closeDropdownTimer) {
      clearTimeout(this.closeDropdownTimer);
      this.closeDropdownTimer = null;
    }
    this.activeDropdown = this.activeDropdown === dropdown ? null : dropdown;
  }

  hideDropdown(dropdown: 'status' | 'purpose' | 'gender') {
    if (!this.deviceService.isMobile() && this.activeDropdown === dropdown) {
      this.closeDropdownTimer = setTimeout(() => {
        if (this.activeDropdown === dropdown) this.activeDropdown = null;
        this.closeDropdownTimer = null;
      }, 200);
    }
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
        newFilters.superRetired = false;
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
        newFilters.active || newFilters.inactive || newFilters.retired || newFilters.superRetired || newFilters.side;
      if (!hasActiveStatusFilter) {
        newFilters[filterType] = true;
      }

      const onlySideSelected = newFilters.side &&
        !newFilters.active && !newFilters.inactive && !newFilters.retired && !newFilters.superRetired;
      if (onlySideSelected) {
        newFilters.rpFriendlyOnly = false;
        newFilters.knowledgeFriendlyOnly = false;
        if (this.activeDropdown === 'purpose') this.activeDropdown = null;
      }
    }

    this.filtersChange.emit(newFilters);
  }

  toggleOnly(filterType: 'rpFriendlyOnly' | 'knowledgeFriendlyOnly') {
    this.filtersChange.emit({ ...this.filters, [filterType]: !this.filters[filterType] });
  }

  toggleGender(filterType: 'moeFemale' | 'nonMoeFemale' | 'male') {
    const newFilters = { ...this.filters, [filterType]: !this.filters[filterType] };
    if (!newFilters.moeFemale && !newFilters.nonMoeFemale && !newFilters.male) {
      newFilters[filterType] = true;
    }
    this.filtersChange.emit(newFilters);
  }

  isLastStatus(filterType: 'active' | 'inactive' | 'retired' | 'superRetired' | 'side'): boolean {
    const statuses = ['active', 'inactive', 'retired', 'superRetired', 'side'] as const;
    return !!this.filters[filterType] && statuses.filter(status => this.filters[status]).length === 1;
  }

  isLastGender(filterType: 'moeFemale' | 'nonMoeFemale' | 'male'): boolean {
    const genders = ['moeFemale', 'nonMoeFemale', 'male'] as const;
    return this.filters[filterType] !== false && genders.filter(gender => this.filters[gender] !== false).length === 1;
  }

  get showingOnlySide(): boolean {
    return !!this.filters.side &&
      !this.filters.active && !this.filters.inactive && !this.filters.retired && !this.filters.superRetired;
  }

  onSearchChange(searchTerm: string) {
    this.searchChange.emit(searchTerm);
  }

  isMobileDevice(): boolean {
    return this.deviceService.isMobile();
  }

}
