export const CHARACTER_IDS = ['crimson', 'clementine', 'maria', 'emerald', 'maddie', 'indigo', 'magenta', 'cyan', 'sophia'] as const;
export type CharacterId = typeof CHARACTER_IDS[number];
export const SCALE_IDS = ['CARE', 'SOCIAL', 'IDEAS', 'CHANGE', 'HEART'] as const;
export type ScaleId = typeof SCALE_IDS[number];
export type BipolarValue = 0 | 0.5 | 1;
export interface BipolarOption { id: string; text: string; value: BipolarValue; }
export interface BipolarQuestion {
  id: string; phase: 1 | 3; scale: ScaleId; prompt: string; options: BipolarOption[];
}
export interface ExplorationQuestion {
  id: string; phase: 2; prompt: string; answers: Record<CharacterId, string>;
}
export interface TiebreakQuestion {
  id: string; phase: 'tie'; prompt: string; answers: Record<CharacterId, string>;
}
export type Question = BipolarQuestion | ExplorationQuestion | TiebreakQuestion;
export interface ResultCopy {
  archetype: string; narrative: string; strengths: string; challenges: string;
}
export interface QuizContent {
  foundation: BipolarQuestion[]; exploration: ExplorationQuestion[];
  refinement: BipolarQuestion[]; tiebreakers: TiebreakQuestion[];
  results: Record<CharacterId, ResultCopy>;
}
export interface CharacterIdentity {
  id: CharacterId; name: string; canonicalName: string; art: string; color: string;
  scale: ScaleId; pole: 0 | 1;
}
export interface ScaleDefinition { id: ScaleId; left: string; right: string; }
export interface RankedCharacter { id: CharacterId; baseScore: number; explorationCount: number; rankingScore: number; }
export interface QuizResult {
  scales: Record<ScaleId, number>; ranking: RankedCharacter[]; tied: CharacterId[];
}
export interface DisplayOption { id: string; text: string; }
