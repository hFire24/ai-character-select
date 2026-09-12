import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CharacterFilters } from '../../pipes/character-filter.pipe';
import { DeviceService } from '../../services/device.service';
import { SearchBar } from '../search-bar/search-bar';
import { SortField } from '../../pipes/sort-characters.pipe';

export type RosterSortOption = SortField | 'idDesc';

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
  @Input() sortBy: RosterSortOption = 'tier';
  @Output() sortChange = new EventEmitter<RosterSortOption>();
  readonly sortOptions: { value: RosterSortOption; label: string }[] = [
    { value: 'tier', label: 'Tier ⬆️' },
    { value: 'shortName', label: 'Name ⬆️' },
    { value: 'id', label: 'ID ⬆️' },
    { value: 'idDesc', label: 'ID ⬇️' },
    { value: 'moe', label: 'Moe ⬇️' },
    { value: 'futuristic', label: 'Futuristic ⬇️' },
    { value: 'mature', label: 'Maturity ⬇️' }
  ];
  @Output() filtersChange = new EventEmitter<CharacterFilters>();
  @Output() searchChange = new EventEmitter<string>();
  isCollapsed = false;
  activeDropdown: 'status' | 'purpose' | 'gender' | 'sort' | null = null;
  hoveredMenu: 'status' | 'purpose' | 'gender' | 'sort' | null = null;
  suppressedMenu: 'status' | 'purpose' | 'gender' | 'sort' | null = null;


  constructor(private deviceService: DeviceService) {}

  get isIOS(): boolean {
    return this.deviceService.isIOS();
  }

  get activeChatCount(): number {
    return Object.keys(localStorage).filter(key => key.startsWith('chatLink_')).length;
  }

  ngOnInit() {
    // Check if device is mobile and collapse legend by default
    this.isCollapsed = this.deviceService.isPhone();
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    if (this.isCollapsed) this.closeDropdowns();
  }

  closeDropdowns(): void {
    this.activeDropdown = null;
    this.suppressedMenu = this.hoveredMenu;
  }

  toggleDropdown(menu: 'status' | 'purpose' | 'gender' | 'sort') {
    if (this.activeDropdown === menu) {
      this.activeDropdown = null;
      this.suppressedMenu = menu;
    } else {
      this.activeDropdown = menu;
      this.suppressedMenu = null;
    }
  }

  isDropdownOpen(menu: 'status' | 'purpose' | 'gender' | 'sort'): boolean {
    return this.activeDropdown === menu ||
      (this.hoveredMenu === menu && this.suppressedMenu !== menu);
  }

  enterMenu(menu: 'status' | 'purpose' | 'gender' | 'sort', event: PointerEvent): void {
    if (event.pointerType === 'mouse') this.hoveredMenu = menu;
  }

  leaveMenu(menu: 'status' | 'purpose' | 'gender' | 'sort'): void {
    if (this.hoveredMenu === menu) this.hoveredMenu = null;
    if (this.suppressedMenu === menu) this.suppressedMenu = null;
  }

  get allStatusesSelected(): boolean {
    return !!(this.filters.active && this.filters.inactive && this.filters.retired &&
      this.filters.superRetired && this.filters.side);
  }

  toggleAllStatuses(): void {
    const selectAll = !this.allStatusesSelected;
    this.filtersChange.emit({
      ...this.filters,
      activeChats: false,
      activeNoChats: false,
      active: true,
      inactive: selectAll,
      retired: selectAll,
      superRetired: selectAll,
      side: selectAll
    });
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
