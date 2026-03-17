# CharacterFilterPipe Quick Reference

## Import
```typescript
import { CharacterFilterOptions } from './pipes';
```

## Common Patterns

### Status Groups
```typescript
// Active + Inactive only
{ status: { active: true, inactive: true } }

// Exclude retired
{ exclude: { statuses: ['retired'] } }

// Side characters only
{ status: { side: true } }
```

### Tier Groups
```typescript
// Favorites only (tier 1-3)
{ tier: { favorite: true } }

// Tier 2 and above
{ tier: { min: 2 } }

// Exclude max tier
{ tier: { exclude: [9] } }
```

### Attribute Groups
```typescript
// Cute/Moe characters
{ attributes: { moe: { min: 7 }, colors: ['pink'] } }

// Futuristic characters
{ attributes: { futuristic: { min: 7 } } }

// Traditional/low-tech
{ attributes: { futuristic: { max: 4 } } }

// Female characters
{ attributes: { pronouns: ['she/her'] } }

// Male characters
{ attributes: { pronouns: ['he/him'] } }

// Only music enjoyers
{ attributes: { musicEnjoyer: true } }

// Exclude music enjoyers
{ attributes: { musicEnjoyer: false } }
```

### Exclusions
```typescript
// Exclude specific characters
{ exclude: { ids: [0, 42, 71] } }

// Exclude by name
{ exclude: { names: ['ChatGPT'] } }

// Exclude future/testing characters
{ exclude: { statuses: ['future'] } }
```

### Search
```typescript
// Simple search
{ search: 'alice' }

// Combines with other filters (search takes priority)
{ 
  status: { active: true },
  search: 'bob'  // Search overrides status filter
}
```

### Complex Combinations
```typescript
// Active females with high moe, favorites only
{
  status: { active: true },
  tier: { favorite: true },
  attributes: {
    pronouns: ['she/her'],
    moe: { min: 7 }
  }
}

// Everything except retired and side music enjoyers
{
  exclude: { statuses: ['retired'] },
  customFilter: (char) => !(char.musicEnjoyer && char.status === 'side')
}
```

## Remember: Update by Reference
```typescript
// When updating filters, create new object
this.filterOptions = {
  ...this.filterOptions,
  status: { ...this.filterOptions.status, active: true }
};
```
