// Test-only neutral fixtures. Never imported by the production quiz.
import { QUIZ_CONTENT } from './personality-quiz.content';
import { Responses, shortlist } from './personality-quiz.scoring';
import { CHARACTER_IDS, QuizContent } from './personality-quiz.types';

export function fixtureContent(): QuizContent {
  const content: QuizContent = structuredClone(QUIZ_CONTENT);
  for (const question of [...content.foundation, ...content.refinement]) {
    question.prompt = `Fixture ${question.id}`;
    question.options = [
      { id: `${question.id}-A`, text: 'Fixture A', value: 0 },
      { id: `${question.id}-N`, text: 'Fixture midpoint', value: 0.5 },
      { id: `${question.id}-B`, text: 'Fixture B', value: 1 }
    ];
  }
  for (const question of [...content.exploration, ...content.tiebreakers]) {
    question.prompt = `Fixture ${question.id}`;
    CHARACTER_IDS.forEach((id, index) => question.answers[id] = `Fixture choice ${index + 1}`);
  }
  for (const id of CHARACTER_IDS) content.results[id] = {
    archetype: 'Fixture archetype', narrative: 'Fixture narrative', strengths: 'Fixture strengths', challenges: 'Fixture challenges'
  };
  return content;
}

export function fixtureResponses(content: QuizContent, seed: number, counts: number[] = [10, 0, 0, 0]): Responses {
  const responses: Responses = {};
  for (const q of [...content.foundation, ...content.refinement]) responses[q.id] = `${q.id}-N`;
  const candidates = shortlist(content, responses, seed);
  let index = 0;
  counts.forEach((count, candidate) => {
    for (let vote = 0; vote < count; vote++) responses[content.exploration[index++].id] = candidates[candidate];
  });
  return responses;
}
