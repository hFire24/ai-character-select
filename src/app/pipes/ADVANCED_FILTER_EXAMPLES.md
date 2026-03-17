# Advanced Character Filter Examples

This document shows how to use the advanced filtering capabilities of `CharacterFilterPipe`.

## Table of Contents
- [Simple Filter (Original)](#simple-filter-original)
- [Advanced Filter Options](#advanced-filter-options)
- [Real-World Examples](#real-world-examples)
- [Migration Guide](#migration-guide)

---

## Simple Filter (Original)

The original simple interface still works for backwards compatibility:

```typescript
import { CharacterFilters } from './pipes/character-filter.pipe';

filters: CharacterFilters = {
  active: true,
  inactive: false,
  retired: false,
  side: false
};
```

```html
<!-- In template -->
<div *ngFor="let char of characters | characterFilter:filters:searchTerm">
  {{ char.name }}
</div>
```

---

## Advanced Filter Options

The new advanced interface provides comprehensive filtering:

### Status Filtering
```typescript
import { CharacterFilterOptions } from './pipes/character-filter.pipe';

filterOptions: CharacterFilterOptions = {
  status: {
    active: true,
    inactive: true,
    retired: false,
    side: false,
    me: false,
    future: false
  }
};
```

### Tier Filtering
```typescript
// Only favorite characters (tier 1-3)
filterOptions: CharacterFilterOptions = {
  tier: { favorite: true }
};

// Tier range (e.g., tier 2-4)
filterOptions: CharacterFilterOptions = {
  tier: { min: 2, max: 4 }
};

// Exclude specific tiers
filterOptions: CharacterFilterOptions = {
  tier: { exclude: [5, 6] }
};

// Exclude max tier
filterOptions: CharacterFilterOptions = {
  tier: { exclude: [9] }  // Assuming 9 is max tier
};
```

### Attribute Filtering
```typescript
// Moe characters (moe >= 7)
filterOptions: CharacterFilterOptions = {
  attributes: {
    moe: { min: 7 }
  }
};

// Not moe (moe < 4)
filterOptions: CharacterFilterOptions = {
  attributes: {
    moe: { max: 3 }
  }
};

// Futuristic characters
filterOptions: CharacterFilterOptions = {
  attributes: {
    futuristic: { min: 7 }
  }
};

// Traditional characters (low futuristic)
filterOptions: CharacterFilterOptions = {
  attributes: {
    futuristic: { max: 4 }
  }
};

// Specific colors
filterOptions: CharacterFilterOptions = {
  attributes: {
    colors: ['pink', 'red']
  }
};

// Specific pronouns
filterOptions: CharacterFilterOptions = {
  attributes: {
    pronouns: ['she/her']
  }
};

// Only music enjoyers
filterOptions: CharacterFilterOptions = {
  attributes: {
    musicEnjoyer: true
  }
};

// Exclude music enjoyers
filterOptions: CharacterFilterOptions = {
  attributes: {
    musicEnjoyer: false
  }
};
```

### Exclusion Filtering
```typescript
// Exclude specific character IDs
filterOptions: CharacterFilterOptions = {
  exclude: {
    ids: [0, 42, 71]  // Exclude Me, and characters 42 & 71
  }
};

// Exclude by name
filterOptions: CharacterFilterOptions = {
  exclude: {
    names: ['ChatGPT', 'TestChar']
  }
};

// Exclude by status
filterOptions: CharacterFilterOptions = {
  exclude: {
    statuses: ['future']
  }
};
```

### Search Filtering
```typescript
// Built-in search
filterOptions: CharacterFilterOptions = {
  search: 'alice'  // Searches shortName and name
};
```

### Custom Filter Function
```typescript
filterOptions: CharacterFilterOptions = {
  customFilter: (char) => {
    // Your custom logic here
    return char.generation > 5 && char.tier < 4;
  }
};
```

---

## Real-World Examples

### Example 1: Spin The Wheel Filters
```typescript
// Replaces the applyFilter() method in spin-the-wheel.ts
filterOptions: CharacterFilterOptions = {
  status: {
    active: this.includeActive,
    inactive: this.includeInactive,
    retired: this.includeRetired,
    side: this.includeSide,
    me: this.includeMe
  },
  tier: {
    favorite: this.includeFavorite
  }
};
```

```html
<!-- In template -->
<div *ngFor="let char of characters | characterFilter:filterOptions">
  {{ char.shortName }}
</div>
```

### Example 2: Tier List Character Pool
```typescript
// For tier-list.ts characterPool getter
filterOptions: CharacterFilterOptions = {
  status: {
    active: this.characterFilter === 'active',
    inactive: this.characterFilter === 'inactive',
    retired: this.characterFilter === 'retired',
    side: this.characterFilter === 'side'
  },
  attributes: {
    musicEnjoyer: this.characterFilter === 'music' ? true : null,
    pronouns: this.characterFilter === 'male' ? ['he/him', 'they/them'] :
              this.characterFilter === 'female' ? ['she/her'] : undefined
  }
};
```

### Example 3: Mood Modal - Cute/Moe Characters
```typescript
filterOptions: CharacterFilterOptions = {
  attributes: {
    moe: { min: 7 },
    colors: ['pink']
  },
  tier: { max: 4 }  // Exclude tier 5+
};
```

### Example 4: Story Helper - Exclude Retired
```typescript
filterOptions: CharacterFilterOptions = {
  exclude: {
    ids: [0, 42, 71],  // Exclude specific characters
    statuses: this.excludeRetired ? ['retired'] : []
  }
};
```

### Example 5: Combined Filters
```typescript
// Active or inactive female characters, tier 1-3, high moe, exclude specific IDs
filterOptions: CharacterFilterOptions = {
  status: {
    active: true,
    inactive: true
  },
  tier: {
    favorite: true  // Tier 1-3
  },
  attributes: {
    pronouns: ['she/her'],
    moe: { min: 7 }
  },
  exclude: {
    ids: [5, 10, 15]
  }
};
```

### Example 6: Hangouts - Complex Filter
```typescript
// Characters not banned, not music enjoyers if side, not max tier
const maxTier = Math.max(...allCharacters.map(c => c.tier || 0));

filterOptions: CharacterFilterOptions = {
  tier: {
    exclude: [maxTier]
  },
  exclude: {
    names: bannedNames
  },
  customFilter: (char) => {
    // Exclude music enjoyers who are side characters
    return !(char.musicEnjoyer && char.status === 'side');
  }
};
```

---

## Migration Guide

### Migrating from Manual Filters

**Before:**
```typescript
// Manual filtering in component
this.filteredCharacters = this.characters.filter(c => {
  const matchesActive = this.includeActive && c.status === "active";
  const matchesInactive = this.includeInactive && c.status === "inactive";
  const matchesFavorite = this.includeFavorite && c.tier >= 1 && c.tier <= 3;
  return matchesActive || matchesInactive || matchesFavorite;
});
```

**After:**
```typescript
// In component - just define options
filterOptions: CharacterFilterOptions = {
  status: {
    active: this.includeActive,
    inactive: this.includeInactive
  },
  tier: {
    favorite: this.includeFavorite
  }
};
```

```html
<!-- In template - apply pipe -->
<div *ngFor="let char of characters | characterFilter:filterOptions">
  {{ char.name }}
</div>
```

### Reactive Updates

When filter checkboxes change, update the filter object with a new reference:

```typescript
onFilterChange() {
  // Create new object reference for pipe change detection
  this.filterOptions = {
    ...this.filterOptions,
    status: {
      active: this.includeActive,
      inactive: this.includeInactive,
      // ...
    }
  };
}
```

---

## Performance Notes

- The pipe is **pure**, so it only re-runs when input references change
- Always create a **new object** when updating filters (don't mutate)
- For dynamic filters, use getters or update the reference on change

```typescript
// ❌ Don't do this - mutates object
this.filterOptions.status.active = true;

// ✅ Do this - new reference
this.filterOptions = {
  ...this.filterOptions,
  status: {
    ...this.filterOptions.status,
    active: true
  }
};
```
