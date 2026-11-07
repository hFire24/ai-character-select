import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PersonalityGirlsQuiz } from './personality-girls-quiz';
import { shortlist } from './personality-quiz.scoring';
import { QUIZ_CONTENT } from './personality-quiz.content';

describe('Personality quiz UI', () => {
  let fixture: ComponentFixture<PersonalityGirlsQuiz>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PersonalityGirlsQuiz], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(PersonalityGirlsQuiz);
    fixture.detectChanges();
  });

  it('labels the unfinished preview and provides accessible choices with guarded navigation', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Authoring preview');
    expect(el.textContent).toContain('Question 1 of 35');
    expect(el.querySelector('fieldset')!.getAttribute('aria-labelledby')).toBe('question-title');
    const next = el.querySelector<HTMLButtonElement>('.question-navigation .primary')!;
    expect(next.disabled).toBeTrue();
    el.querySelector<HTMLInputElement>('input')!.click();
    fixture.detectChanges();
    expect(next.disabled).toBeFalse();
    next.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Question 2 of 35');
  });

  it('renders only four exploration answers without character-name hints', () => {
    const session = fixture.componentInstance.session;
    // Production placeholder bank is binary. Fill Foundation with actual option IDs.
    QUIZ_CONTENT.foundation.forEach(q => session.responses[q.id] = q.options[0].id);
    session.candidates = shortlist(QUIZ_CONTENT, session.responses, session.seed);
    session.currentIndex = 20;
    fixture.detectChanges();
    const labels: NodeListOf<HTMLLabelElement> = fixture.nativeElement.querySelectorAll('.answer');
    expect(labels.length).toBe(4);
    labels.forEach(label => expect(label.textContent).not.toMatch(/Crimson|Clementine|Maria|Emerald|Maddie|Indigo|Magenta|Cyan|Sophia/));
  });

  it('renders nine eligible result rankings and five accessible inverse bars', () => {
    const session = fixture.componentInstance.session;
    session.responses = {};
    [...QUIZ_CONTENT.foundation, ...QUIZ_CONTENT.refinement].forEach(q => session.responses[q.id] = q.options[0].id);
    session.candidates = shortlist(QUIZ_CONTENT, session.responses, session.seed);
    QUIZ_CONTENT.exploration.forEach(q => session.responses[q.id] = session.candidates[0]);
    session.currentIndex = 34;
    session.next();
    if (session.mode === 'tie') {
      for (let i = 0; i < 5; i++) { session.choose(session.contenders[0]); session.next(); }
    }
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('[role="meter"]').length).toBe(5);
    expect(el.textContent).toContain('Your Personality Girl Is');
    expect(el.textContent).toContain('not percentages or probabilities');
    expect(el.querySelector('img')?.getAttribute('src')).toMatch(/^assets\/Icons\//);
  });

  it('keeps the original radio checked when a shortlist-changing edit is canceled', () => {
    const component = fixture.componentInstance;
    const session = component.session;
    QUIZ_CONTENT.foundation.forEach((q, index) => session.responses[q.id] = q.options[Math.floor(index / 5) % 2].id);
    session.candidates = shortlist(QUIZ_CONTENT, session.responses, session.seed);
    QUIZ_CONTENT.exploration.forEach(q => session.responses[q.id] = session.candidates[0]);
    // Two answers at each pole produce equal affinities, exercising the shortlist boundary.
    const changed = QUIZ_CONTENT.foundation.find(q => {
      const proposed = shortlist(QUIZ_CONTENT, { ...session.responses, [q.id]: q.options[1].id }, session.seed);
      return proposed.some(id => !session.candidates.includes(id));
    })!;
    expect(changed).toBeDefined();
    session.currentIndex = session.main.findIndex(q => q.id === changed.id);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    el.querySelectorAll<HTMLInputElement>('input')[1].click();
    fixture.detectChanges();
    expect(el.querySelector('.change-warning')).not.toBeNull();
    el.querySelector<HTMLButtonElement>('.change-warning .secondary')!.click();
    fixture.detectChanges();
    expect(el.querySelector<HTMLInputElement>('input:checked')!.value).toBe(changed.options[0].id);
    expect(session.selected).toBe(changed.options[0].id);
    expect(session.answeredCount).toBe(30);
  });
});
