function encode(value: unknown): string {
  const characters: unknown[] = [];
  const characterIndexes = new WeakMap<object, number>();
  const state = JSON.stringify(value, (_key, item) => {
    // Undo snapshots share character records. Store each record once, rather
    // than repeating biographies hundreds of times in browser storage.
    if (item && typeof item === 'object' && typeof item.id === 'number' && typeof item.img === 'string') {
      let index = characterIndexes.get(item);
      if (index === undefined) {
        index = characters.length;
        characterIndexes.set(item, index);
        characters.push(item);
      }
      return { sessionType: 'Character', index };
    }
    if (item instanceof Set) return { sessionType: 'Set', entries: [...item] };
    if (item instanceof Map) return { sessionType: 'Map', entries: [...item] };
    return item;
  });
  return JSON.stringify({ characters, state });
}

function decode(value: string): Record<string, unknown> {
  const envelope = JSON.parse(value);
  return JSON.parse(envelope.state, (_key, item) => {
    if (item?.sessionType === 'Character') return envelope.characters[item.index];
    if (item?.sessionType === 'Set' && Array.isArray(item.entries)) return new Set(item.entries);
    if (item?.sessionType === 'Map' && Array.isArray(item.entries)) return new Map(item.entries);
    return item;
  });
}

// Save only explicitly selected progress fields, never services or image exports.
export class SavedSession {
  error = '';
  private previous = '';
  private defaults = '';
  private ready = false;
  private readonly key: string;

  constructor(name: string, private readonly fields: string[]) {
    this.key = `character-select.session.v1.${name}`;
  }

  initialize(target: object): boolean {
    this.defaults = encode(this.pick(target));
    this.ready = true;
    try {
      const stored = localStorage.getItem(this.key);
      if (!stored) return false;
      const state = decode(stored);
      const defaults = this.pick(target);
      if (!state || this.fields.some(field => !(field in state) || !this.compatible(defaults[field], state[field]))) {
        throw new Error('Invalid session');
      }
      this.apply(target, state);
      this.previous = stored;
      return true;
    } catch {
      this.error = 'Saved progress could not be restored. A new session has been opened.';
      return false;
    }
  }

  save(target: object): void {
    if (!this.ready) return;
    try {
      const serialized = encode(this.pick(target));
      if (serialized === this.previous) return;
      localStorage.setItem(this.key, serialized);
      this.previous = serialized;
      this.error = '';
    } catch {
      this.error = 'Progress could not be saved in this browser. Keep this page open to avoid losing it.';
    }
  }

  restart(target: object): void {
    this.apply(target, decode(this.defaults));
    this.previous = '';
    this.save(target);
  }

  static clear(name: string): void {
    try { localStorage.removeItem(`character-select.session.v1.${name}`); } catch { /* save reports failures */ }
  }

  private pick(target: object): Record<string, unknown> {
    const record = target as Record<string, unknown>;
    return Object.fromEntries(this.fields.map(field => [field, record[field]]));
  }

  private apply(target: object, state: Record<string, unknown>): void {
    const record = target as Record<string, unknown>;
    for (const field of this.fields) record[field] = state[field];
  }

  private compatible(initial: unknown, saved: unknown): boolean {
    if (initial === null) return saved === null || typeof saved === 'object';
    if (initial instanceof Set) return saved instanceof Set;
    if (initial instanceof Map) return saved instanceof Map;
    if (Array.isArray(initial)) return Array.isArray(saved);
    return typeof initial === typeof saved;
  }
}
