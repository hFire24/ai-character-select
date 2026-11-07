import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-quiz-page',
  imports: [RouterLink],
  template: `
    <h1>{{ title }}</h1>
    <p>This quiz is coming soon.</p>
    <a routerLink="/quizzes">Back to quizzes</a>
  `,
  styles: `
    :host { display: block; max-width: 760px; margin: 0 auto; }
    p { margin: 24px 0; }
    a { color: #6550bd; font-weight: 700; }
    a:focus-visible { outline: 3px solid #9180d4; outline-offset: 4px; }
    @media (prefers-color-scheme: dark) { a { color: #b8a8ff; } }
  `
})
export class QuizPage {
  readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
}
