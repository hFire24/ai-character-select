import { BipolarQuestion, CharacterId, CharacterIdentity, CHARACTER_IDS, QuizContent, SCALE_IDS, ScaleDefinition } from './personality-quiz.types';
import { AUTHOR_CONTENT } from './personality-quiz.author';

// Framework slots and identity metadata. Editorial copy lives in personality-quiz.author.ts.
// These identities reference the existing roster artwork, not generated substitutes.
export const CHARACTERS: Record<CharacterId, CharacterIdentity> = {
  crimson: { id: 'crimson', name: 'Crimson', canonicalName: 'Crimson the Daredevil', art: 'extended/Crimson.png', color: '#c83445', scale: 'CARE', pole: 0 },
  clementine: { id: 'clementine', name: 'Clementine', canonicalName: 'Clementine the Cowgirl', art: 'extended/Clementine.png', color: '#c66916', scale: 'SOCIAL', pole: 0 },
  maria: { id: 'maria', name: 'Maria', canonicalName: 'Amarilla "Maria" the Scholar', art: 'extended/Maria.png', color: '#a17c0b', scale: 'IDEAS', pole: 0 },
  emerald: { id: 'emerald', name: 'Emerald', canonicalName: 'Emerald "Emmy" the Future Nurse', art: 'main/Emmy.png', color: '#23864c', scale: 'CARE', pole: 1 },
  maddie: { id: 'maddie', name: 'Maddie', canonicalName: 'Maddie the Luminary', art: 'main/Maddie.png', color: '#377da8', scale: 'HEART', pole: 1 },
  indigo: { id: 'indigo', name: 'Indigo', canonicalName: 'Indigo the Artist', art: 'extended/Indigo.png', color: '#6a58ab', scale: 'SOCIAL', pole: 1 },
  magenta: { id: 'magenta', name: 'Magenta', canonicalName: 'Magical Girl Dreamy Magenta', art: 'extended/Magenta.png', color: '#b23a8d', scale: 'IDEAS', pole: 1 },
  cyan: { id: 'cyan', name: 'Cyan', canonicalName: 'Cyan the DJ', art: 'extended/Cyan.png', color: '#147b87', scale: 'CHANGE', pole: 1 },
  sophia: { id: 'sophia', name: 'Sophia', canonicalName: 'Sophia the Historian', art: 'extended/Sophia.png', color: '#906345', scale: 'CHANGE', pole: 0 }
};

export const SCALES: ScaleDefinition[] = [
  { id: 'CARE', left: 'Crimson', right: 'Emerald' },
  { id: 'SOCIAL', left: 'Clementine', right: 'Indigo' },
  { id: 'IDEAS', left: 'Maria', right: 'Magenta' },
  { id: 'CHANGE', left: 'Sophia', right: 'Cyan' },
  // The lower HEART pole is not a character or personality label.
  { id: 'HEART', left: 'Lower Maddie affinity', right: 'Maddie' }
];

const todo = (slot: string) => `TODO: author content — ${slot}`;
function bipolar(phase: 1 | 3, count: number): BipolarQuestion[] {
  return Array.from({ length: count }, (_, index) => {
    const id = `${phase === 1 ? 'F' : 'R'}${String(index + 1).padStart(2, '0')}`;
    return {
      id, phase, scale: SCALE_IDS[index % 5], prompt: todo(`${id} Question ${phase === 3 ? index + 31 : index + 1}`),
      options: [
        { id: `${id}-A`, text: todo('A'), value: 0 },
        { id: `${id}-B`, text: todo('B'), value: 1 }
      ]
    };
  });
}
function characterAnswers(id: string): Record<CharacterId, string> {
  // Labels intentionally contain no character-name hints. Association is in the keys.
  return Object.fromEntries(CHARACTER_IDS.map((character, index) => [character, todo(`${id} ${String.fromCharCode(65 + index)}`)])) as Record<CharacterId, string>;
}
export const QUIZ_CONTENT: QuizContent = {
  foundation: bipolar(1, 20),
  exploration: Array.from({ length: 10 }, (_, index) => {
    const id = `E${String(index + 1).padStart(2, '0')}`;
    return { id, phase: 2, prompt: todo(`${id} Question ${index + 21}`), answers: characterAnswers(id) };
  }),
  refinement: bipolar(3, 5),
  tiebreakers: Array.from({ length: 5 }, (_, index) => {
    const id = `T${String(index + 1).padStart(2, '0')}`;
    return { id, phase: 'tie', prompt: todo(`${id} Tie-breaker ${index + 1}`), answers: characterAnswers(id) };
  }),
  results: Object.fromEntries(CHARACTER_IDS.map(id => [id, {
    archetype: todo(`${id} archetype`), narrative: todo(`${id} result narrative`),
    strengths: todo(`${id} strengths`), challenges: todo(`${id} challenges`)
  }])) as QuizContent['results']
};

// Merge by stable ID, allowing gradual authoring without touching scoring or UI.
for (const question of QUIZ_CONTENT.foundation) Object.assign(question, AUTHOR_CONTENT.foundation[question.id as keyof typeof AUTHOR_CONTENT.foundation]);
for (const question of QUIZ_CONTENT.refinement) Object.assign(question, AUTHOR_CONTENT.refinement[question.id as keyof typeof AUTHOR_CONTENT.refinement]);
for (const question of QUIZ_CONTENT.exploration) {
  const copy = AUTHOR_CONTENT.exploration[question.id as keyof typeof AUTHOR_CONTENT.exploration];
  if (copy?.prompt !== undefined) question.prompt = copy.prompt;
  Object.assign(question.answers, copy?.answers);
}
for (const question of QUIZ_CONTENT.tiebreakers) {
  const copy = AUTHOR_CONTENT.tiebreakers[question.id as keyof typeof AUTHOR_CONTENT.tiebreakers];
  if (copy?.prompt !== undefined) question.prompt = copy.prompt;
  Object.assign(question.answers, copy?.answers);
}
for (const id of CHARACTER_IDS) Object.assign(QUIZ_CONTENT.results[id], AUTHOR_CONTENT.results[id]);

export const SCORING_CONFIG = {
  // Provisional; the owner has not approved the final weight.
  explorationPointWeight: 1
} as const;
