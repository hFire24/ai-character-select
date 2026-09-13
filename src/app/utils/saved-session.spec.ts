import { SavedSession } from './saved-session';

describe('SavedSession', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('restores nested maps and sets used by comparison undo and tournament winners', () => {
    const initial = { round: 1, winners: new Set<number>(), history: [] as unknown[] };
    const save = new SavedSession('test', ['round', 'winners', 'history']);
    save.initialize(initial);
    initial.round = 3;
    initial.winners.add(42);
    initial.history.push({ comparisons: new Map([['42', new Map([['43', 'greater']])]]), ties: [new Set(['42', '44'])] });
    save.save(initial);
    const restored = { round: 1, winners: new Set<number>(), history: [] as any[] };
    expect(new SavedSession('test', ['round', 'winners', 'history']).initialize(restored)).toBeTrue();
    expect(restored.round).toBe(3);
    expect(restored.winners.has(42)).toBeTrue();
    expect(restored.history[0].comparisons.get('42').get('43')).toBe('greater');
    expect(restored.history[0].ties[0].has('44')).toBeTrue();
  });

  it('restarts from fresh defaults even after restoring a previous session', () => {
    const state = { started: false, placements: [] as number[] };
    const first = new SavedSession('test', ['started', 'placements']);
    first.initialize(state);
    state.started = true;
    state.placements.push(42);
    first.save(state);
    const next = { started: false, placements: [] as number[] };
    const second = new SavedSession('test', ['started', 'placements']);
    second.initialize(next);
    second.restart(next);
    expect(next).toEqual({ started: false, placements: [] });
    const reloaded = { started: false, placements: [] as number[] };
    new SavedSession('test', ['started', 'placements']).initialize(reloaded);
    expect(reloaded).toEqual(next);
  });

  it('ignores corrupt saved data without overwriting defaults', () => {
    localStorage.setItem('character-select.session.v1.test', '{bad json');
    const state = { round: 1 };
    const save = new SavedSession('test', ['round']);
    expect(save.initialize(state)).toBeFalse();
    expect(state.round).toBe(1);
    expect(save.error).not.toBe('');
  });

  it('reports storage failures without interrupting the session', () => {
    const save = new SavedSession('test', ['round']);
    const state = { round: 1 };
    save.initialize(state);
    spyOn(Storage.prototype, 'setItem').and.throwError('Quota exceeded');
    expect(() => save.save(state)).not.toThrow();
    expect(save.error).toContain('could not be saved');
  });

  it('only writes when progress changes', () => {
    const state = { round: 1 };
    const save = new SavedSession('test', ['round']);
    save.initialize(state);
    const write = spyOn(Storage.prototype, 'setItem').and.callThrough();
    save.save(state);
    save.save(state);
    expect(write).toHaveBeenCalledTimes(1);
    state.round++;
    save.save(state);
    expect(write).toHaveBeenCalledTimes(2);
  });
});
