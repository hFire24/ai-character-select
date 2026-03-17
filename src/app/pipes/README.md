# Custom Pipes Documentation

This directory contains reusable Angular pipes for the character-select application.

## Available Pipes

### 1. CharacterFilterPipe ⭐ **ENHANCED**

Comprehensive filtering for characters with both simple and advanced options.

**Location:** `character-filter.pipe.ts`

#### Simple Usage (Original):

```typescript
// In your component.ts:
import { CharacterFilterPipe, CharacterFilters } from './pipes/character-filter.pipe';

@Component({
  imports: [CharacterFilterPipe, CommonModule]
})
export class MyComponent {
  characters: Character[] = [];
  
  filters: CharacterFilters = {
    active: true,
    inactive: false,
    retired: false,
    side: false
  };
  
  searchTerm = '';
}
```

```html
<!-- In your template.html: -->
<div *ngFor="let char of characters | characterFilter:filters:searchTerm">
  {{ char.name }}
</div>
```

#### Advanced Usage (New):

```typescript
import { CharacterFilterOptions } from './pipes/character-filter.pipe';

@Component({
  imports: [CharacterFilterPipe]
})
export class MyComponent {
  filterOptions: CharacterFilterOptions = {
    status: { active: true, inactive: true },
    tier: { favorite: true },  // Tier 1-3 only
    attributes: {
      moe: { min: 7 },
      colors: ['pink', 'red']
    },
    exclude: { ids: [0, 42] },
    search: 'alice'
  };
}
```

```html
<div *ngFor="let char of characters | characterFilter:filterOptions">
  {{ char.name }}
</div>
```

**See [ADVANCED_FILTER_EXAMPLES.md](ADVANCED_FILTER_EXAMPLES.md) for comprehensive documentation.**

**Advanced Filter Capabilities:**
- ✅ Status filtering (active, inactive, retired, side, me, future)
- ✅ Tier filtering (min/max, favorite, exclude)
- ✅ Attribute filtering (moe, futuristic, colors, pronouns, musicEnjoyer)
- ✅ Exclusions (by ID, name, status)
- ✅ Built-in search
- ✅ Custom filter functions
- ✅ Backwards compatible with simple interface

---

### 2. SortCharactersPipe

Sorts characters by any specified field in ascending or descending order.

**Location:** `sort-characters.pipe.ts`

**Available Sort Fields:**
- `'id'` - Character ID number
- `'name'` - Full character name
- `'shortName'` - Character short name/nickname
- `'generation'` - Character generation number
- `'tier'` - Character tier level
- `'moe'` - Moe rating
- `'futuristic'` - Futuristic rating
- `'birthday'` - Birthday date (if available)
- `'creationDate'` - Creation date (if available)

**Usage:**

```typescript
// In your component.ts:
import { SortCharactersPipe, SortField, SortDirection } from './pipes/sort-characters.pipe';

@Component({
  imports: [SortCharactersPipe, CommonModule]
})
export class MyComponent {
  characters: Character[] = [];
  sortBy: SortField = 'id';
  sortDirection: SortDirection = 'asc';
}
```

```html
<!-- In your template.html: -->

<!-- Sort by ID (ascending): -->
<div *ngFor="let char of characters | sortCharacters:'id':'asc'">
  {{ char.name }}
</div>

<!-- Sort by name (descending): -->
<div *ngFor="let char of characters | sortCharacters:'name':'desc'">
  {{ char.name }}
</div>

<!-- Sort by generation (default ascending): -->
<div *ngFor="let char of characters | sortCharacters:'generation'">
  {{ char.name }}
</div>
```

---

## Combining Pipes

Pipes can be chained together. They are applied from left to right:

```html
<!-- Filter AND sort: -->
<div *ngFor="let char of characters | characterFilter:filters:searchTerm | sortCharacters:'name':'asc'">
  {{ char.name }}
</div>
```

This will:
1. First filter characters by status and search term
2. Then sort the filtered results by name in ascending order

---

## Modern Angular Syntax (@for)

If using Angular 17+ control flow syntax:

```html
@for (char of characters | characterFilter:filters:searchTerm | sortCharacters:sortBy:sortDirection; track char.id) {
  <div>{{ char.name }}</div>
}
```

---

## Dynamic Sorting Example

Create interactive sort buttons that toggle direction:

```typescript
// In your component.ts:
export class MyComponent {
  sortBy: SortField = 'id';
  sortDirection: SortDirection = 'asc';
  
  setSortBy(field: SortField) {
    // Toggle direction if clicking same field
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New field, default to ascending
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
  }
}
```

```html
<!-- In your template.html: -->
<button (click)="setSortBy('id')">
  Sort by ID {{ sortBy === 'id' ? (sortDirection === 'asc' ? '↑' : '↓') : '' }}
</button>

<div *ngFor="let char of characters | sortCharacters:sortBy:sortDirection">
  {{ char.name }}
</div>
```

---

## Importing Pipes

### From barrel export (recommended):
```typescript
import { CharacterFilterPipe, SortCharactersPipe } from './pipes';
```

### Individual imports:
```typescript
import { CharacterFilterPipe } from './pipes/character-filter.pipe';
import { SortCharactersPipe } from './pipes/sort-characters.pipe';
```

---

## Testing

Each pipe has a corresponding `.spec.ts` file with comprehensive unit tests:
- `character-filter.pipe.spec.ts`
- `sort-characters.pipe.spec.ts`

Run tests with:
```bash
npm test
```
