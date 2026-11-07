import { Component, ElementRef, HostListener, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CHARACTERS, QUIZ_CONTENT } from './personality-quiz.content';
import { CharacterId, CHARACTER_IDS, QuizResult, SCALE_IDS } from './personality-quiz.types';
import { PersonalityQuizResult } from './personality-quiz-result';
import { PersonalityQuizStore } from './personality-quiz.store';
import { validateContent } from './personality-quiz.validation';

@Component({
  selector: 'app-personality-girls-quiz',
  imports: [RouterLink, PersonalityQuizResult],
  templateUrl: './personality-girls-quiz.html',
  styleUrl: './personality-girls-quiz.scss'
})
export class PersonalityGirlsQuiz {
  readonly session = new PersonalityQuizStore();
  readonly readiness = validateContent(QUIZ_CONTENT);
  readonly content = QUIZ_CONTENT;
  readonly resultShortcuts = CHARACTER_IDS.map((id, index) => ({ id, letter: String.fromCharCode(65 + index), name: CHARACTERS[id].name }));
  previewResult: QuizResult | null = null;
  previewCharacter: CharacterId | null = null;
  get displayedResult(): QuizResult | null {
    return this.previewResult ?? (this.session.mode === 'results' ? this.session.result : null);
  }
  get displayedWinners(): CharacterId[] {
    return this.previewCharacter ? [this.previewCharacter] : this.session.winners;
  }
  readonly questionHeading = viewChild<ElementRef<HTMLElement>>('questionHeading');
  readonly resultHeading = viewChild<ElementRef<HTMLElement>>('resultHeading');
  readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');
  readonly answerGroup = viewChild<ElementRef<HTMLFieldSetElement>>('answerGroup');

  @HostListener('document:keydown', ['$event'])
  onResultShortcut(event: KeyboardEvent): void {
    if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.defaultPrevented || event.isComposing) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || target.closest('textarea, select') ||
      (target instanceof HTMLInputElement && !['radio', 'checkbox', 'button', 'submit', 'reset'].includes(target.type)))) return;
    const shortcut = this.resultShortcuts.find(item => item.letter === event.key.toUpperCase());
    if (!shortcut || this.readiness.errors.length) return;
    event.preventDefault();
    this.previewCharacter = shortcut.id;
    // Sample display data only: never modify answers, rankings, or tie state in the session.
    this.previewResult = {
      scales: Object.fromEntries(SCALE_IDS.map(id => [id, 0.5])) as QuizResult['scales'],
      ranking: CHARACTER_IDS.map(id => ({ id, baseScore: 50, explorationCount: 0, rankingScore: 50 })),
      tied: [...CHARACTER_IDS]
    };
    setTimeout(() => this.resultHeading()?.nativeElement.focus());
  }

  choose(option: string): void {
    this.session.choose(option);
    if (this.session.pendingOption) {
      // Native radio activation happens before change. Restore the committed value
      // while confirmation is pending, including when the user cancels the edit.
      this.answerGroup()?.nativeElement.querySelectorAll('input').forEach(input => {
        input.checked = input.value === this.session.selected;
      });
      setTimeout(() => this.confirmButton()?.nativeElement.focus());
    }
  }

  resolveChange(confirm: boolean): void {
    if (confirm) this.session.confirmChange();
    else this.session.cancelChange();
    setTimeout(() => this.answerGroup()?.nativeElement.querySelector<HTMLInputElement>('input:checked')?.focus());
  }

  move(action: 'next' | 'back' | 'review' | 'restart'): void {
    const wasPreview = this.previewResult !== null;
    this.previewResult = null;
    this.previewCharacter = null;
    if (!(wasPreview && action === 'review')) this.session[action]();
    setTimeout(() => (this.displayedResult ? this.resultHeading() : this.questionHeading())?.nativeElement.focus());
  }
}
