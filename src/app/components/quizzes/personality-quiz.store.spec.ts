import { fixtureContent, fixtureResponses } from './personality-quiz.fixtures';
import { shortlist } from './personality-quiz.scoring';
import { PersonalityQuizStore } from './personality-quiz.store';

describe('Personality quiz session', () => {
  const seed = 17;
  function completed(counts: number[] = [10, 0, 0, 0]) {
    const content = fixtureContent();
    const store = new PersonalityQuizStore(content, seed);
    store.responses = fixtureResponses(content, seed, counts);
    store.candidates = shortlist(content, store.responses, seed);
    store.currentIndex = 34;
    return store;
  }

  it('requires an answer and advances through all 35 main questions', () => {
    const store = new PersonalityQuizStore(fixtureContent(), seed);
    store.next();
    expect(store.currentIndex).toBe(0);
    for (let i = 0; i < 35; i++) {
      expect(store.currentIndex).toBe(i);
      expect(store.options.length).toBe(i >= 20 && i < 30 ? 4 : 3);
      const q = store.question;
      store.choose('options' in q ? `${q.id}-N` : store.candidates[0]);
      store.next();
    }
    expect(store.mode).toBe('results');
    expect(store.answeredCount).toBe(35);
    expect(store.winners.length).toBe(1);
  });

  it('preserves four candidates, selection, and option order across Back/Next', () => {
    const store = completed();
    store.currentIndex = 20;
    const candidates = [...store.candidates];
    const options = store.options;
    const selection = store.selected;
    store.next();
    store.back();
    expect(store.candidates).toEqual(candidates);
    expect(store.options).toEqual(options);
    expect(store.selected).toBe(selection);
  });

  it('runs exactly five tie-breakers for a two-way tie and keeps scores unchanged', () => {
    const store = completed([5, 5, 0, 0]);
    store.next();
    expect(store.mode).toBe('tie');
    expect(store.contenders.length).toBe(2);
    const result = structuredClone(store.result);
    const winner = store.contenders[0];
    for (let i = 0; i < 5; i++) {
      expect(store.mode).toBe('tie');
      expect(store.tieIndex).toBe(i);
      expect(store.options.map(o => o.id).sort()).toEqual([...store.contenders].sort());
      store.choose(i < 3 ? winner : store.contenders[1]);
      store.next();
    }
    expect(store.mode).toBe('results');
    expect(store.winners).toEqual([winner]);
    expect(store.result).toEqual(result);
    expect(store.votes![winner]).toBe(3);
  });

  it('retains co-winners after five multiway tie-breakers without extra prompts', () => {
    const store = completed([3, 3, 3, 1]);
    store.next();
    expect(store.contenders.length).toBe(3);
    const contenders = [...store.contenders];
    [0, 1, 0, 1, 2].forEach(index => { store.choose(contenders[index]); store.next(); });
    expect(store.mode).toBe('results');
    expect(store.winners).toEqual(contenders.slice(0, 2));
    expect(store.votes![contenders[2]]).toBe(1);
  });

  it('preserves tie order and replaces votes on edits instead of adding votes', () => {
    const store = completed([5, 5, 0, 0]);
    store.next();
    const options = store.options;
    store.choose(store.contenders[0]);
    store.next();
    store.back();
    expect(store.options).toEqual(options);
    store.choose(store.contenders[1]);
    while (store.mode === 'tie') { store.choose(store.contenders[1]); store.next(); }
    expect(store.votes![store.contenders[0]]).toBe(0);
    expect(store.votes![store.contenders[1]]).toBe(5);
  });

  it('warns before changing shortlist, permits cancel, and clears stale answers on confirmation', () => {
    const store = completed([5, 5, 0, 0]);
    store.next();
    store.choose(store.contenders[0]);
    store.review();
    const old = { ...store.responses };
    // Find a Foundation edit that changes this seeded shortlist.
    const q = store.content.foundation.find(item => {
      const proposed = shortlist(store.content, { ...store.responses, [item.id]: `${item.id}-A` }, seed);
      return proposed.some(id => !store.candidates.includes(id));
    })!;
    expect(q).toBeDefined();
    store.currentIndex = store.main.findIndex(item => item.id === q.id);
    store.choose(`${q.id}-A`);
    expect(store.pendingOption).toBe(`${q.id}-A`);
    expect(store.responses).toEqual(old);
    store.cancelChange();
    expect(store.responses).toEqual(old);
    store.choose(`${q.id}-A`);
    store.confirmChange();
    expect(store.responses[q.id]).toBe(`${q.id}-A`);
    expect(store.answeredCount).toBe(20);
    expect(store.responses['T01']).toBeUndefined();
    expect(store.result).toBeNull();
    expect(store.contenders).toEqual([]);
    expect(store.notice).toContain('cleared');
  });

  it('invalidates tie state when refinement changes, then recalculates all nine scores', () => {
    const store = completed([5, 5, 0, 0]);
    store.next();
    store.choose(store.contenders[0]);
    store.back();
    expect(store.mode).toBe('main');
    store.choose('R05-A');
    expect(store.responses['T01']).toBeUndefined();
    expect(store.contenders).toEqual([]);
    store.next();
    expect(store.result!.ranking.length).toBe(9);
  });

  it('keeps downstream answers and display order when a Foundation edit retains the same four girls', () => {
    const store = completed();
    store.currentIndex = 20;
    const oldOptions = store.options;
    const exploration = store.content.exploration.map(q => store.responses[q.id]);
    const edit = store.content.foundation.flatMap(q => q.options.map(option => ({ q, option })))
      .find(({ q, option }) => option.id !== store.responses[q.id] &&
        shortlist(store.content, { ...store.responses, [q.id]: option.id }, seed).every(id => store.candidates.includes(id)))!;
    expect(edit).toBeDefined();
    store.currentIndex = store.main.findIndex(q => q.id === edit.q.id);
    store.choose(edit.option.id);
    expect(store.pendingOption).toBeNull();
    expect(store.content.exploration.map(q => store.responses[q.id])).toEqual(exploration);
    store.currentIndex = 20;
    expect(store.options).toEqual(oldOptions);
  });

  it('resets the entire attempt on retake', () => {
    const store = completed();
    store.next();
    store.restart();
    expect(store.mode).toBe('main');
    expect(store.currentIndex).toBe(0);
    expect(store.responses).toEqual({});
    expect(store.candidates).toEqual([]);
    expect(store.winners).toEqual([]);
    expect(store.result).toBeNull();
  });
});
