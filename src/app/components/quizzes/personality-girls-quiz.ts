import { Component, ElementRef, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QUIZ_CONTENT } from './personality-quiz.content';
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
  readonly questionHeading = viewChild<ElementRef<HTMLElement>>('questionHeading');
  readonly resultHeading = viewChild<ElementRef<HTMLElement>>('resultHeading');
  readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');
  readonly answerGroup = viewChild<ElementRef<HTMLFieldSetElement>>('answerGroup');

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
    this.session[action]();
    setTimeout(() => (this.session.mode === 'results' ? this.resultHeading() : this.questionHeading())?.nativeElement.focus());
  }
}
