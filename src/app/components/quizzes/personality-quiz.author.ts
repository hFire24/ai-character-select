import { BipolarOption, CharacterId, ResultCopy } from './personality-quiz.types';

type FirstFive = '01' | '02' | '03' | '04' | '05';
type FirstTen = FirstFive | '06' | '07' | '08' | '09' | '10';
type FirstTwenty = FirstTen | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20';
interface BipolarCopy { prompt?: string; options?: BipolarOption[]; }
interface CharacterCopy { prompt?: string; answers?: Partial<Record<CharacterId, string>>; }
export interface AuthorContent {
  foundation: Partial<Record<`F${FirstTwenty}`, BipolarCopy>>;
  exploration: Partial<Record<`E${FirstTen}`, CharacterCopy>>;
  refinement: Partial<Record<`R${FirstFive}`, BipolarCopy>>;
  tiebreakers: Partial<Record<`T${FirstFive}`, CharacterCopy>>;
  results: Partial<Record<CharacterId, Partial<ResultCopy>>>;
}

// Owner-authored/approved copy goes here. Each slot can be filled independently.
// Missing fields retain conspicuous TODO placeholders in the authoring preview.
// Foundation F01–F20, Exploration E01–E10, Refinement R01–R05, ties T01–T05.
// Bipolar options must include value 0 and 1, with optional 0.5 midpoint.
// See PERSONALITY_QUIZ.md for the exact authoring shape and publication checks.
export const AUTHOR_CONTENT: AuthorContent = {
  foundation: {},
  exploration: {},
  refinement: {},
  tiebreakers: {},
  results: {}
};
