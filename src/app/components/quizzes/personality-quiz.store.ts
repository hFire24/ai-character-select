import { QUIZ_CONTENT } from './personality-quiz.content';
import { calculateResult, Responses, shuffled, shortlist, tieVotes } from './personality-quiz.scoring';
import { CharacterId, CHARACTER_IDS, DisplayOption, Question, QuizContent, QuizResult } from './personality-quiz.types';

function attemptSeed(): number { return crypto.getRandomValues(new Uint32Array(1))[0]; }

// Component-scoped session; pure content and scoring also work outside Angular.
export class PersonalityQuizStore {
  readonly main: Question[];
  responses: Responses = {};
  currentIndex = 0;
  mode: 'main' | 'tie' | 'results' = 'main';
  tieIndex = 0;
  candidates: CharacterId[] = [];
  contenders: CharacterId[] = [];
  result: QuizResult | null = null;
  pendingOption: string | null = null;
  notice = '';

  constructor(readonly content: QuizContent = QUIZ_CONTENT, public seed: number = attemptSeed()) {
    this.main = [...content.foundation, ...content.exploration, ...content.refinement];
  }
  get question(): Question {
    return this.mode === 'tie' ? this.content.tiebreakers[this.tieIndex] : this.main[this.currentIndex];
  }
  get selected(): string | undefined { return this.responses[this.question.id]; }
  get phaseName(): string {
    if (this.mode === 'tie') return 'Tie-breakers';
    return this.question.phase === 1 ? 'Foundation' : this.question.phase === 2 ? 'Exploration' : 'Refinement';
  }
  get answeredCount(): number { return this.main.filter(q => this.responses[q.id] !== undefined).length; }
  get options(): DisplayOption[] {
    const q = this.question;
    if ('options' in q) return q.options.map(option => ({ id: option.id, text: option.text }));
    const eligible = q.phase === 2 ? this.candidates : this.contenders;
    return shuffled(CHARACTER_IDS.filter(id => eligible.includes(id)), this.seed, q.id)
      .map(id => ({ id, text: q.answers[id] }));
  }
  get votes(): Record<CharacterId, number> | null {
    return this.contenders.length > 1 && this.content.tiebreakers.every(q => this.responses[q.id])
      ? tieVotes(this.content, this.responses, this.contenders) : null;
  }
  get winners(): CharacterId[] {
    if (!this.result) return [];
    if (this.result.tied.length === 1) return this.result.tied;
    const votes = this.votes;
    if (!votes) return [];
    const max = Math.max(...this.contenders.map(id => votes[id]));
    return this.contenders.filter(id => votes[id] === max);
  }
  choose(option: string): void {
    if (this.pendingOption || !this.options.some(item => item.id === option) || option === this.selected) return;
    const q = this.question;
    if (q.phase === 1 && this.candidates.length) {
      const proposed = shortlist(this.content, { ...this.responses, [q.id]: option }, this.seed);
      const differs = proposed.some(id => !this.candidates.includes(id));
      const downstream = [...this.content.exploration, ...this.content.refinement].some(item => this.responses[item.id]);
      if (differs && downstream) { this.pendingOption = option; return; }
    }
    this.applyChoice(option);
  }
  confirmChange(): void {
    if (!this.pendingOption) return;
    const option = this.pendingOption;
    this.pendingOption = null;
    this.applyChoice(option);
  }
  cancelChange(): void { this.pendingOption = null; }
  private applyChoice(option: string): void {
    const q = this.question;
    this.responses[q.id] = option;
    if (q.phase !== 'tie') {
      this.content.tiebreakers.forEach(item => delete this.responses[item.id]);
      this.contenders = [];
      this.result = null;
    }
    if (q.phase === 1 && this.candidates.length) {
      const proposed = shortlist(this.content, this.responses, this.seed);
      if (proposed.some(id => !this.candidates.includes(id))) {
        [...this.content.exploration, ...this.content.refinement].forEach(item => delete this.responses[item.id]);
        this.notice = 'Your exploration choices changed. Exploration and refinement answers have been cleared.';
      }
      this.candidates = proposed;
    }
  }
  next(): void {
    if (this.pendingOption || !this.selected) return;
    if (this.mode === 'tie') {
      if (this.tieIndex < 4) this.tieIndex++;
      else this.mode = 'results';
      return;
    }
    if (this.currentIndex === 19) this.candidates = shortlist(this.content, this.responses, this.seed);
    if (this.currentIndex < 34) { this.currentIndex++; return; }
    this.result = calculateResult(this.content, this.responses, this.seed);
    this.contenders = this.result.tied.length > 1 ? [...this.result.tied] : [];
    if (this.contenders.length) { this.mode = 'tie'; this.tieIndex = 0; }
    else this.mode = 'results';
  }
  back(): void {
    if (this.pendingOption) return;
    if (this.mode === 'tie' && this.tieIndex > 0) this.tieIndex--;
    else if (this.mode === 'tie') { this.mode = 'main'; this.currentIndex = 34; }
    else if (this.currentIndex > 0) this.currentIndex--;
  }
  review(): void { this.mode = 'main'; this.currentIndex = 0; }
  restart(): void {
    this.responses = {};
    this.currentIndex = 0;
    this.tieIndex = 0;
    this.mode = 'main';
    this.candidates = [];
    this.contenders = [];
    this.result = null;
    this.pendingOption = null;
    this.notice = '';
    this.seed = attemptSeed();
  }
}
