import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CHARACTERS, SCORING_CONFIG, SCALES } from './personality-quiz.content';
import { CharacterId, QuizContent, QuizResult } from './personality-quiz.types';

@Component({
  selector: 'app-personality-quiz-result',
  imports: [DecimalPipe],
  templateUrl: './personality-quiz-result.html',
  styleUrl: './personality-quiz-result.scss'
})
export class PersonalityQuizResult {
  @Input({ required: true }) result!: QuizResult;
  @Input({ required: true }) winners!: CharacterId[];
  @Input({ required: true }) content!: QuizContent;
  @Input() votes: Record<CharacterId, number> | null = null;
  @Output() retake = new EventEmitter<void>();
  @Output() review = new EventEmitter<void>();
  readonly characters = CHARACTERS;
  readonly scales = SCALES;
  readonly config = SCORING_CONFIG;
  get secondary() { return this.result.ranking.filter(item => !this.winners.includes(item.id)).slice(0, 3); }
}
