import { Component, computed, input, output, signal } from '@angular/core';
import { Character } from '../../../services/character.service';
import { iconAssetPath, useTallIconAssetPath } from '../../../utils/character-assets';

// Character stats and default allocations

export interface CharacterStats {
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  accuracy: number;
  evade: number;
}

type HiddenStats = Pick<CharacterStats, 'attack' | 'defense' | 'accuracy' | 'evade'>;

// Generated characters spend the full stat budget; custom saves may use less.
const hiddenAllocations: HiddenStats[] = [];
for (let attack = 3; attack <= 7; attack++) {
  for (let defense = 3; defense <= 7; defense++) {
    for (let accuracy = 3; accuracy <= 7; accuracy++) {
      for (let evade = 3; evade <= 7; evade++) {
        if (attack + defense + accuracy + evade === 21) {
          hiddenAllocations.push({ attack, defense, accuracy, evade });
        }
      }
    }
  }
}

// Keep each character's initial allocation stable across matches and seats.
export function characterStats(id: number): CharacterStats {
  const characterId = Math.abs(Math.trunc(id));
  const hp = 40 + (characterId % 8) * 10;
  const allocationIndex = (Math.imul(characterId, 2654435761) >>> 0) % hiddenAllocations.length;
  return { hp, mp: 150 - hp, ...hiddenAllocations[allocationIndex] };
}

// Special types, character configuration, and saved settings

export type SpecialEffect = 'accurate-attack' | 'powerful-attack' | 'reckless-attack' | 'overwhelming-attack' | 'focusing-action' | 'defense-boost' | 'attack-boost' | 'accuracy-boost' | 'evasiveness-boost' | 'poisoning-attack' | 'silencing-attack' | 'confusing-attack' | 'locking-attack' | 'defense-lower-attack' | 'attack-lower-attack' | 'accuracy-lower-attack' | 'evasiveness-lower-attack' | 'charge' | 'summon-ally' | 'heal';

export interface SpecialAttack {
  name: string;
  effect: SpecialEffect;
  description: string;
}

export type SpecialAttacks = [SpecialAttack, SpecialAttack, SpecialAttack, SpecialAttack];

export interface CharacterCombatConfig {
  stats: CharacterStats;
  specials: SpecialAttacks;
  allyId?: number | null;
}

export const specialEffects: Record<SpecialEffect, { label: string; description: string; group: 'Attacking Moves' | 'Debuffing Attacks' | 'Buffing Moves' | 'Healing Moves' }> = {
  'accurate-attack': { group: 'Attacking Moves', label: 'Accurate Attack', description: '10 MP. Attack with +3 Accuracy.' },
  'powerful-attack': { group: 'Attacking Moves', label: 'Powerful Attack', description: '10 MP. Attack with +3 Attack.' },
  'reckless-attack': { group: 'Attacking Moves', label: 'Reckless Attack', description: '10 MP. Attack with +5 Attack and -2 Accuracy.' },
  'overwhelming-attack': { group: 'Attacking Moves', label: 'Overwhelming Attack', description: '20 MP. Attack with +4 Attack and +3 Accuracy.' },
  'focusing-action': { group: 'Buffing Moves', label: 'Mana Regeneration', description: '10 MP. Restore 10% of maximum MP before later moves for 12 turns.' },
  'defense-boost': { group: 'Buffing Moves', label: 'Defense Boost', description: '10 MP. Raise Defense by 2 for 6 turns.' },
  'attack-boost': { group: 'Buffing Moves', label: 'Attack Boost', description: '10 MP. Raise Attack by 2 for 6 turns.' },
  'accuracy-boost': { group: 'Buffing Moves', label: 'Accuracy Boost', description: '10 MP. Raise Accuracy by 2 for 6 turns.' },
  'evasiveness-boost': { group: 'Buffing Moves', label: 'Evasiveness Boost', description: '10 MP. Raise Evade by 2 for 6 turns.' },
  'poisoning-attack': { group: 'Debuffing Attacks', label: 'Poisoning Attack', description: '20 MP. On hit, poison the target for 5 turns, dealing D6 damage before each of their moves.' },
  'silencing-attack': { group: 'Debuffing Attacks', label: 'Silencing Attack', description: '20 MP. On hit, disable the target’s special attacks for 4 turns.' },
  'confusing-attack': { group: 'Debuffing Attacks', label: 'Confusing Attack', description: '20 MP. On hit, confuse the target for 6 turns: 10% skip, 60% random move, 30% normal.' },
  'locking-attack': { group: 'Debuffing Attacks', label: 'Mana Drain', description: '20 MP. On hit, drain 10% of the target’s maximum MP before each of their moves for 12 turns.' },
  'defense-lower-attack': { group: 'Debuffing Attacks', label: 'Defense Lower', description: '20 MP. On hit, lower Defense by 2 for 6 turns.' },
  'attack-lower-attack': { group: 'Debuffing Attacks', label: 'Attack Lower', description: '20 MP. On hit, lower Attack by 2 for 6 turns.' },
  'accuracy-lower-attack': { group: 'Debuffing Attacks', label: 'Accuracy Lower', description: '20 MP. On hit, lower Accuracy by 2 for 6 turns.' },
  'evasiveness-lower-attack': { group: 'Debuffing Attacks', label: 'Evasiveness Lower', description: '20 MP. On hit, lower Evade by 2 for 6 turns.' },
  'charge': { group: 'Buffing Moves', label: 'Charge', description: '20 MP. Double the next attack’s damage. Consumed on attack; lasts 2 turns.' },
  'summon-ally': { group: 'Buffing Moves', label: 'Summon Ally', description: '20 MP. Summon an ally to attack before later moves for 10 turns.' },
  'heal': { group: 'Healing Moves', label: 'Heal', description: '20 MP. Restore 4 + D10 HP, up to maximum HP.' },
};

// Add character-specific values here. Names and effect types are independent.
export const characterCombatOverrides: Record<number, {
  stats?: Partial<CharacterStats>;
  specials?: SpecialAttacks;
  allyId?: number | null;
}> = {};

// Keep unsaved loadouts consistent for a character throughout this session.
const generatedSpecials = new Map<number, SpecialAttacks>();

function defaultSpecials(id: number): SpecialAttacks {
  const existing = generatedSpecials.get(id);
  if (existing) return existing;
  const pool = Object.keys(specialEffects) as SpecialEffect[];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const selected: SpecialEffect[] = [];
  const categoryCounts = new Map<string, number>();
  for (const effect of pool) {
    const category = specialEffects[effect].group;
    const count = categoryCounts.get(category) ?? 0;
    if (category !== 'Attacking Moves' && count >= 2) continue;
    selected.push(effect);
    categoryCounts.set(category, count + 1);
    if (selected.length === 4) break;
  }
  const specials = selected.map(effect => ({
    name: specialEffects[effect].label,
    description: '{name} uses a special attack.',
    effect
  })) as SpecialAttacks;
  generatedSpecials.set(id, specials);
  return specials;
}

export function characterCombatConfig(id: number): CharacterCombatConfig {
  const overrides = characterCombatOverrides[id];
  const stats = { ...characterStats(id), ...overrides?.stats };
  const hidden = [stats.attack, stats.defense, stats.accuracy, stats.evade];
  if (![stats.hp, stats.mp].every(value => Number.isInteger(value) && value >= 40 && value <= 110 && value % 10 === 0)
    || stats.hp + stats.mp > 150
    || !hidden.every(value => Number.isInteger(value) && value >= 3 && value <= 7)
    || hidden.reduce((sum, value) => sum + value, 0) > 21) {
    throw new Error(`Invalid combat stats for character ${id}`);
  }
  const specials: SpecialAttacks = overrides?.specials ?? defaultSpecials(id);
  if (specials.length !== 4 || new Set(specials.map(s => s.effect)).size !== 4 || specials.some(special => typeof special.name !== 'string' || !special.name.trim() || typeof special.description !== 'string' || !Object.hasOwn(specialEffects, special.effect))) {
    throw new Error(`Invalid special attacks for character ${id}`);
  }
  const allyId = overrides?.allyId ?? null;
  if (allyId !== null && (!Number.isInteger(allyId) || allyId < 0)) {
    throw new Error(`Invalid summoned ally for character ${id}`);
  }
  return { stats, allyId, specials: specials.map(special => ({ ...special })) as SpecialAttacks };
}

export type CombatAction =
  | { type: 'fight' | 'guard' | 'focus' }
  | { type: 'special'; special: SpecialAttack };

const storageKey = 'character-arcade-combat-v1';

// Preserve existing browser saves after internal attack type renames.
const legacyEffectTypes: Record<string, SpecialEffect> = {
  'defense-break-attack': 'defense-lower-attack',
  'attack-reducing-attack': 'attack-lower-attack',
  'accuracy-lowering-attack': 'accuracy-lower-attack',
  'evasiveness-falling-attack': 'evasiveness-lower-attack'
};

export function loadCombatConfig(id: number): CharacterCombatConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')[id];
    if (saved) {
      if (Array.isArray(saved.specials)) {
        saved.specials = saved.specials.map((special: SpecialAttack) => ({
          ...special, effect: legacyEffectTypes[special.effect] ?? special.effect
        }));
      }
      characterCombatOverrides[id] = saved;
      try { return characterCombatConfig(id); }
      catch { delete characterCombatOverrides[id]; }
    }
  } catch { /* Use defaults when storage is unavailable or invalid. */ }
  return characterCombatConfig(id);
}

export function saveCombatConfig(id: number, config: CharacterCombatConfig) {
  const previous = characterCombatOverrides[id];
  characterCombatOverrides[id] = config;
  try {
    const validated = characterCombatConfig(id);
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    saved[id] = validated;
    localStorage.setItem(storageKey, JSON.stringify(saved));
  } catch (error) {
    if (previous) characterCombatOverrides[id] = previous;
    else delete characterCombatOverrides[id];
    throw error;
  }
}

// Dice rolls, attack resolution, and status effects

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export interface AttackResult {
  d20: number;
  d10: number | null;
  accuracyRoll: number;
  hitThreshold: number;
  hit: boolean;
  attackRoll: number | null;
  damage: number;
}

export function resolveAttack(
  attacker: CharacterStats,
  defender: CharacterStats,
  roll: (sides: number) => number = rollDie,
  hitBase = 7
): AttackResult {
  const d20 = roll(20);
  const accuracyRoll = d20 + attacker.accuracy;
  const hitThreshold = hitBase + defender.evade;
  if (accuracyRoll <= hitThreshold) {
    return { d20, d10: null, accuracyRoll, hitThreshold, hit: false, attackRoll: null, damage: 0 };
  }
  const d10 = roll(10);
  const attackRoll = 1 + d10 + attacker.attack - defender.defense;
  return { d20, d10, accuracyRoll, hitThreshold, hit: true, attackRoll, damage: Math.max(0, attackRoll) };
}

export function guardedStats(stats: CharacterStats, guarding: boolean): CharacterStats {
  return guarding ? { ...stats, defense: stats.defense + 3, evade: stats.evade + 3 } : stats;
}

export interface SpecialAttackRule {
  cost: number;
  attackBonus: number;
  accuracyBonus: number;
}

export const specialAttackRules: Partial<Record<SpecialEffect, SpecialAttackRule>> = {
  'accurate-attack': { cost: 10, attackBonus: 0, accuracyBonus: 3 },
  'powerful-attack': { cost: 10, attackBonus: 3, accuracyBonus: 0 },
  'reckless-attack': { cost: 10, attackBonus: 5, accuracyBonus: -2 },
  'overwhelming-attack': { cost: 20, attackBonus: 4, accuracyBonus: 3 },
  'poisoning-attack': { cost: 20, attackBonus: 0, accuracyBonus: 0 },
  'confusing-attack': { cost: 20, attackBonus: 0, accuracyBonus: 0 },
  'silencing-attack': { cost: 20, attackBonus: 0, accuracyBonus: 0 },
  'locking-attack': { cost: 20, attackBonus: 0, accuracyBonus: 0 },
  'defense-lower-attack': { cost: 20, attackBonus: 0, accuracyBonus: 0 },
  'attack-lower-attack': { cost: 20, attackBonus: 0, accuracyBonus: 0 },
  'accuracy-lower-attack': { cost: 20, attackBonus: 0, accuracyBonus: 0 },
  'evasiveness-lower-attack': { cost: 20, attackBonus: 0, accuracyBonus: 0 },
  'defense-boost': { cost: 10, attackBonus: 0, accuracyBonus: 0 },
  'attack-boost': { cost: 10, attackBonus: 0, accuracyBonus: 0 },
  'accuracy-boost': { cost: 10, attackBonus: 0, accuracyBonus: 0 },
  'evasiveness-boost': { cost: 10, attackBonus: 0, accuracyBonus: 0 },
  'focusing-action': { cost: 10, attackBonus: 0, accuracyBonus: 0 },
  'charge': { cost: 20, attackBonus: 0, accuracyBonus: 0 },
  'heal': { cost: 20, attackBonus: 0, accuracyBonus: 0 },
  'summon-ally': { cost: 20, attackBonus: 0, accuracyBonus: 0 }
};

export function specialAttackStats(stats: CharacterStats, rule: SpecialAttackRule): CharacterStats {
  return { ...stats, attack: stats.attack + rule.attackBonus, accuracy: stats.accuracy + rule.accuracyBonus };
}

export function specialAttackRule(effect: SpecialEffect): SpecialAttackRule {
  const cost = effect === 'focusing-action' || effect.endsWith('-boost') ? 10 : 20;
  return specialAttackRules[effect] ?? { cost, attackBonus: 0, accuracyBonus: 3 };
}

export function specialAttackMessage(
  effect: SpecialEffect, name: string, pronouns = '', health = 0
): string {
  const possessive = /\bshe\b|\bher\b/i.test(pronouns) ? 'her'
    : /\bhe\b|\bhim\b/i.test(pronouns) ? 'his' : 'their';
  const nextPossessive = possessive[0].toUpperCase() + possessive.slice(1);
  const messages: Record<SpecialEffect, string> = {
    'accurate-attack': 'uses a more accurate attack!',
    'powerful-attack': 'uses a more powerful attack!',
    'reckless-attack': 'attacks recklessly!',
    'overwhelming-attack': 'uses a more overwhelming attack!',
    'poisoning-attack': 'uses a poisoning attack!',
    'silencing-attack': 'uses a silencing attack!',
    'confusing-attack': 'uses a confusion-inducing attack!',
    'locking-attack': 'uses Mana Drain!',
    'defense-lower-attack': 'uses a defense-lowering attack!',
    'evasiveness-lower-attack': 'uses an evasiveness-reducing attack!',
    'attack-lower-attack': 'uses an attack-lowering attack!',
    'accuracy-lower-attack': 'uses a blinding attack!',
    'focusing-action': 'will gain mana at the start of each of their turns, beginning next turn.',
    'defense-boost': `raises ${possessive} defense.`,
    'attack-boost': `raises ${possessive} attack.`,
    'accuracy-boost': `raises ${possessive} accuracy.`,
    'evasiveness-boost': `raises ${possessive} evasiveness.`,
    'charge': `has charged up ${possessive} attack. ${nextPossessive} next attack's damage will be doubled!`,
    'summon-ally': 'has summoned an ally!',
    'heal': `heals, gaining ${health} HP.`
  };
  return `${name} ${messages[effect]}`;
}

export interface CombatBuff {
  ally?: Character;
  type: 'mana-regeneration' | 'defense-boost' | 'attack-boost' | 'accuracy-boost' | 'evasiveness-boost' | 'charge' | 'summon-ally';
  label: string;
  expiresAfterMove?: number;
}

export interface CombatDebuff {
  type: 'poison' | 'confusion' | 'silence' | 'mana-drain' | 'defense-lower' | 'attack-lower' | 'accuracy-lower' | 'evasiveness-lower';
  label: string;
  expiresAfterMove: number;
}

export interface CombatStatus {
  guarding: boolean;
  buff: CombatBuff | null;
  debuff: CombatDebuff | null;
}

export function poisonDamage(rollD6: () => number = () => rollDie(6)): number {
  return rollD6();
}

export function confusionOutcome(rollD10: () => number = () => rollDie(10)): 'nothing' | 'random' | 'normal' {
  const roll = rollD10();
  return roll === 1 ? 'nothing' : roll <= 7 ? 'random' : 'normal';
}

export function combatStatBreakdown(
  base: CharacterStats, effective: CharacterStats, status: CombatStatus,
  special?: { label: string; rule: SpecialAttackRule }
) {
  return (['attack', 'defense', 'accuracy', 'evade'] as const).map(stat => {
    const modifiers: { source: string; amount: number }[] = [];
    const guardBonus = status.guarding && (stat === 'defense' || stat === 'evade') ? 3 : 0;
    if (guardBonus) modifiers.push({ source: 'Guard', amount: guardBonus });
    const boost = Object.values(statBoosts).find(effect => effect.type === status.buff?.type);
    if (boost?.stat === stat) modifiers.push({ source: boost.label, amount: 2 });
    const lowering = Object.values(statLoweringAttacks).find(effect => effect.type === status.debuff?.type);
    if (lowering?.stat === stat) modifiers.push({ source: lowering.label, amount: -2 });
    const specialBonus = special ? stat === 'attack' ? special.rule.attackBonus
      : stat === 'accuracy' ? special.rule.accuracyBonus : 0 : 0;
    if (specialBonus) modifiers.push({ source: special!.label, amount: specialBonus });
    const total = effective[stat] + specialBonus;
    return {
      stat, base: base[stat], modifiers, total,
      expression: `${base[stat]}${modifiers.map(modifier => ` ${modifier.amount < 0 ? '-' : '+'} ${Math.abs(modifier.amount)}`).join('')}`,
      calculation: `${base[stat]}${modifiers.map(modifier => ` ${modifier.amount < 0 ? '-' : '+'} ${Math.abs(modifier.amount)} (${modifier.source})`).join('')} = ${total}`
    };
  });
}

export type LoweredStat = 'attack' | 'defense' | 'accuracy' | 'evade';

export const statLoweringAttacks: Partial<Record<SpecialEffect, {
  type: CombatDebuff['type']; label: string; stat: LoweredStat
}>> = {
  'defense-lower-attack': { type: 'defense-lower', label: 'Defense Down', stat: 'defense' },
  'attack-lower-attack': { type: 'attack-lower', label: 'Attack Down', stat: 'attack' },
  'accuracy-lower-attack': { type: 'accuracy-lower', label: 'Accuracy Down', stat: 'accuracy' },
  'evasiveness-lower-attack': { type: 'evasiveness-lower', label: 'Evasiveness Down', stat: 'evade' }
};

export const statBoosts: Partial<Record<SpecialEffect, {
  type: CombatBuff['type']; label: string; stat: LoweredStat
}>> = {
  'defense-boost': { type: 'defense-boost', label: 'Defense Up', stat: 'defense' },
  'attack-boost': { type: 'attack-boost', label: 'Attack Up', stat: 'attack' },
  'accuracy-boost': { type: 'accuracy-boost', label: 'Accuracy Up', stat: 'accuracy' },
  'evasiveness-boost': { type: 'evasiveness-boost', label: 'Evasiveness Up', stat: 'evade' }
};

export function statusStats(base: CharacterStats, status: CombatStatus): CharacterStats {
  const stats = { ...guardedStats(base, status.guarding) };
  const lowering = Object.values(statLoweringAttacks).find(effect => effect.type === status.debuff?.type);
  if (lowering) stats[lowering.stat] -= 2;
  const boost = Object.values(statBoosts).find(effect => effect.type === status.buff?.type);
  if (boost) stats[boost.stat] += 2;
  return stats;
}

export function isBuffingMove(effect: SpecialEffect): boolean {
  return !!statBoosts[effect] || effect === 'focusing-action' || effect === 'charge' || effect === 'summon-ally';
}

// Debuff application shares one duration and replacement path.
const attackDebuffs: Partial<Record<SpecialEffect, {
  type: CombatDebuff['type']; label: string; duration: number; announcement: string
}>> = {
  'poisoning-attack': { type: 'poison', label: 'Poison', duration: 5, announcement: 'is poisoned!' },
  'confusing-attack': { type: 'confusion', label: 'Confusion', duration: 6, announcement: 'is confused!' },
  'silencing-attack': { type: 'silence', label: 'Silence', duration: 4, announcement: 'is silenced!' },
  'locking-attack': { type: 'mana-drain', label: 'Mana Drain', duration: 12, announcement: 'is affected with Mana Drain!' },
  ...Object.fromEntries(Object.entries(statLoweringAttacks).map(([effect, lowering]) => [effect, {
    type: lowering.type, label: lowering.label, duration: 6,
    announcement: `is affected by ${lowering.label}!`
  }]))
};

// Matchup screen and turn flow

@Component({
  selector: 'app-matchup',
  templateUrl: './matchup.html',
  styleUrl: './matchup.scss'
})
export class Matchup {
  readonly player = input.required<Character>();
  readonly opponent = input.required<Character>();
  readonly characters = input<Character[]>([]);
  readonly back = output<void>();
  readonly isPlayerTurn = input(true);
  readonly gameOver = input(false);
  readonly newGame = output<void>();

  readonly action = output<CombatAction>();
  readonly specialEffects = specialEffects;
  readonly actionMessage = signal('Choose an action to begin.');
  readonly effectMessage = signal('');
  readonly resultMessage = signal('');
  readonly messageLines = computed(() =>
    [this.actionMessage(), this.effectMessage(), this.resultMessage()].map(line =>
      line.split(/(\bHit!|\bMiss!)/).map(text => ({
        text,
        hit: text === 'Hit!',
        miss: text === 'Miss!'
      }))
    )
  );
  readonly battleMessage = computed(() => [this.actionMessage(), this.effectMessage(), this.resultMessage()].join('\n'));

  private addResult(message: string) {
    this.resultMessage.update(current => [current, message.replaceAll('\n', ' ')].filter(Boolean).join(' '));
  }

  private announceMove(index: 0 | 1, move: CombatAction) {
    const character = this.fighters()[index].character;
    this.actionMessage.set(move.type === 'special' ? this.specialMessage(character, move.special)
      : `${this.displayName(character)} ${move.type === 'fight' ? 'fights!' : move.type === 'guard' ? 'guards!' : 'focuses.'}`);
  }
  private readonly hp = signal<[number | null, number | null]>([null, null]);
  private readonly mp = signal<[number | null, number | null]>([null, null]);
  private readonly aiTurn = signal(false);
  readonly statuses = signal<[CombatStatus, CombatStatus]>([
    { guarding: false, buff: null, debuff: null }, { guarding: false, buff: null, debuff: null }
  ]);
  readonly completedMoves = signal(0);
  private moveMessages: string[] = [];
  private debugLines: string[] = [];
  private debugModifiers: { side: string; stat: string; calculation: string }[] = [];

  private setResource(resource: 'hp' | 'mp', index: 0 | 1, value: number) {
    const maximum = this.fighters()[index].stats[resource];
    this[resource].update(values => {
      const next: [number | null, number | null] = [...values];
      next[index] = Math.max(0, Math.min(maximum, value));
      return next;
    });
  }

  private expiresIn(turns: number) { return this.completedMoves() + turns + 1; }

  private actorPhrase(character: Character, thirdPerson: string) {
    return `${this.displayName(character)} ${thirdPerson}`;
  }

  private specialMessage(character: Character, special: SpecialAttack, health = 0) {
    const name = this.displayName(character);
    const description = special.description.trim().replaceAll('{name}', name);
    return [`${name} uses ${special.name}!`, description].filter(Boolean).join(' ');
  }

  private setStatus(index: 0 | 1, patch: Partial<CombatStatus>) {
    for (const slot of ['buff', 'debuff'] as const) {
      if (patch[slot]) {
        this.debugLines.push(`${index === 0 ? 'Player' : 'AI'} ${slot}: ${patch[slot]!.label}`);
      }
    }
    this.statuses.update(statuses => {
      const next: [CombatStatus, CombatStatus] = [...statuses];
      next[index] = { ...statuses[index], ...patch };
      return next;
    });
  }

  private expireEffects(index: 0 | 1) {
    for (const slot of ['buff', 'debuff'] as const) {
      const effect = this.statuses()[index][slot];
      if (effect?.expiresAfterMove !== undefined && this.completedMoves() >= effect.expiresAfterMove) {
        this.setStatus(index, { [slot]: null });
        const owner = this.fighters()[index];
        const name = this.displayName(owner.character);
        this.debugLines.push(`${name}: ${effect.label} ${slot} expired`);
        if (effect.type === 'summon-ally')
          this.moveMessages.push(`${this.displayName(effect.ally ?? owner.character)} is dismissed.`);
        else
          this.moveMessages.push(`${name}'s ${effect.label} ${slot} wore off.`);
      }
    }
  }

  private beginMove(index: 0 | 1): boolean {
    this.expireEffects(index);
    // Resolve the active buff before any debuff or chosen action.
    if (this.statuses()[index].buff?.type === 'mana-regeneration') {
      const fighter = this.fighters()[index];
      const restored = Math.min(fighter.stats.mp / 10, fighter.stats.mp - fighter.mp);
      this.setResource('mp', index, fighter.mp + restored);
      this.debugLines.push(`Mana Regeneration: max MP(${fighter.stats.mp}) / 10; MP ${fighter.mp} + ${restored} = ${fighter.mp + restored}`);
      this.moveMessages.push(`${this.actorPhrase(fighter.character, 'gains')} ${restored} MP from Mana Regeneration.`);
    }
    if (this.statuses()[index].debuff?.type === 'mana-drain') {
      const fighter = this.fighters()[index];
      const drained = Math.min(fighter.mp, fighter.stats.mp / 10);
      this.setResource('mp', index, fighter.mp - drained);
      this.debugLines.push(`Mana Drain: max MP(${fighter.stats.mp}) / 10; MP ${fighter.mp} - ${drained} = ${fighter.mp - drained}`);
      this.moveMessages.push(`${this.actorPhrase(fighter.character, 'loses')} ${drained} MP to Mana Drain.`);
      return true;
    }
    if (this.statuses()[index].debuff?.type !== 'poison') return true;
    const fighter = this.fighters()[index];
    const d6 = rollDie(6);
    const damage = poisonDamage(() => d6);
    const remainingHp = Math.max(0, fighter.hp - damage);
    this.setResource('hp', index, remainingHp);
    this.debugLines.push(`Poison: D6(${d6}) = ${damage} damage; HP ${fighter.hp} -> ${remainingHp}`);
    this.moveMessages.push(`${this.actorPhrase(fighter.character, 'takes')} ${damage} poison damage.`);
    if (remainingHp === 0) {
      this.addResult(index === 0 ? 'You lose!' : 'You win!');
      this.finishMove(index);
      return false;
    }
    return true;
  }
  readonly isOver = computed(() => this.gameOver() || this.hp().some(value => value === 0));
  readonly yourTurn = computed(() => this.isPlayerTurn() && !this.aiTurn() && !this.isOver());

  readonly specialAttackRule = specialAttackRule;
  isSilenced(index: 0 | 1) { return this.statuses()[index].debuff?.type === 'silence'; }

  private attack(attackerIndex: 0 | 1, special?: SpecialAttack) {
    const defenderIndex = attackerIndex === 0 ? 1 : 0;
    const fighters = this.fighters();
    const attacker = fighters[attackerIndex];
    const defender = fighters[defenderIndex];
    const rule = special ? specialAttackRule(special.effect) : undefined;
    const attackStats = rule ? specialAttackStats(attacker.stats, rule) : attacker.stats;
    const baseStats = [this.playerConfig().stats, this.opponentConfig().stats];
    const modifierLabel = special ? `${specialEffects[special.effect].label}${specialAttackRules[special.effect] ? '' : ' (Accurate Attack fallback)'}` : '';
    const attackerBreakdown = combatStatBreakdown(baseStats[attackerIndex], attacker.stats, this.statuses()[attackerIndex],
      rule ? { label: modifierLabel, rule } : undefined);
    const defenderBreakdown = combatStatBreakdown(baseStats[defenderIndex], defender.stats, this.statuses()[defenderIndex]);
    const charged = this.statuses()[attackerIndex].buff?.type === 'charge';
    const rolled = resolveAttack(attackStats, defender.stats);
    const result = { ...rolled, damage: rolled.damage * (charged ? 2 : 1) };
    if (charged) {
      this.setStatus(attackerIndex, { buff: null });
      this.debugLines.push(`Charge consumed: ${rolled.damage} damage x 2 = ${result.damage}`);
    }
    const remainingHp = Math.max(0, defender.hp - result.damage);
    this.setResource('hp', defenderIndex, remainingHp);
    const name = this.displayName(attacker.character);
    const generic = special ? specialAttackMessage(special.effect, name, attacker.character.pronouns) : '';
    const debuff = special ? attackDebuffs[special.effect] : undefined;
    let message = `${generic} ${result.hit ? `Hit! ${this.displayName(defender.character)} takes ${result.damage} damage.` : 'Miss! No damage dealt.'}`.trim();
    if (debuff && result.hit && remainingHp > 0) {
      this.setStatus(defenderIndex, { debuff: {
        type: debuff.type, label: debuff.label, expiresAfterMove: this.expiresIn(debuff.duration)
      } });
    }
    if (remainingHp === 0) message += attackerIndex === 0 ? '\nYou win!' : '\nYou lose!';
    this.addResult(message);
    this.debugLines.push(
      `${name} -> ${this.displayName(defender.character)}: ${special?.name || 'Fight'}${special && !specialAttackRules[special.effect] ? ' (Accurate Attack fallback)' : ''}`,
      `Hit check: D20(${result.d20}) + Accuracy(${attackerBreakdown.find(row => row.stat === 'accuracy')!.expression}) = ${result.accuracyRoll}; must exceed 7 + Evade(${defenderBreakdown.find(row => row.stat === 'evade')!.expression}) = ${result.hitThreshold}: ${result.hit ? 'HIT' : 'MISS'}`,
      result.d10 === null ? 'Damage: D10 skipped (miss)'
        : `Damage: 1 + D10(${result.d10}) + Attack(${attackerBreakdown.find(row => row.stat === 'attack')!.expression}) - Defense(${defenderBreakdown.find(row => row.stat === 'defense')!.expression}) = ${result.attackRoll}; ${result.damage} damage`,
      `Target HP: ${defender.hp} -> ${remainingHp}`
    );
    this.debugModifiers = [
      ...attackerBreakdown.filter(row => row.stat === 'attack' || row.stat === 'accuracy')
        .map(row => ({ side: 'Attacker', stat: row.stat, calculation: row.calculation })),
      ...defenderBreakdown.filter(row => row.stat === 'defense' || row.stat === 'evade')
        .map(row => ({ side: 'Defender', stat: row.stat, calculation: row.calculation }))
    ];
  }

  private guard(index: 0 | 1) {
    this.setStatus(index, { guarding: true });
    this.debugLines.push('Guard: +3 Defense, +3 Evade until the opponent completes a move');
    const character = this.fighters()[index].character;
    this.addResult('Guard activated.');
  }

  private focus(index: 0 | 1) {
    const fighter = this.fighters()[index];
    const restored = Math.min(fighter.stats.mp / 5, fighter.stats.mp - fighter.mp);
    this.setResource('mp', index, fighter.mp + restored);
    this.debugLines.push(`Focus: MP ${fighter.mp} + ${restored} = ${fighter.mp + restored} / ${fighter.stats.mp}`);
    this.addResult(`${restored} MP gained.`);
  }

  private finishMove(index: 0 | 1) {
    const other = index === 0 ? 1 : 0;
    if (this.statuses()[other].guarding) {
      this.setStatus(other, { guarding: false });
      this.debugLines.push(`${this.displayName(this.fighters()[other].character)}: Guard expired`);
    }
    this.completedMoves.update(count => count + 1);
    this.expireEffects(index);
    this.aiTurn.set(index === 0 && !this.isOver());
    // The incoming fighter's turn starts now. Clear expired effects before
    // their action controls or AI selection inspect buffs and debuffs.
    if (!this.isOver()) this.expireEffects(other);
    if (this.moveMessages.length) {
      this.effectMessage.set(this.moveMessages.join(' '));
      this.moveMessages = [];
    }
    const actor = this.displayName(this.fighters()[index].character);
    console.groupCollapsed(`[Combat] Move ${this.completedMoves()} | ${index === 0 ? 'Player' : 'AI'}: ${actor}`);
    console.debug(this.debugLines.join('\n'));
    if (this.debugModifiers.length) console.table(this.debugModifiers);
    console.debug(`Next: ${this.isOver() ? 'Game over' : this.aiTurn() ? 'Opponent turn' : 'Player turn'}`);
    console.groupEnd();
  }

  private summonAttack(index: 0 | 1): boolean {
    if (this.statuses()[index].buff?.type !== 'summon-ally') return true;
    const other = index === 0 ? 1 : 0;
    const owner = this.fighters()[index];
    const target = this.fighters()[other];
    const summonStats = { ...owner.stats, accuracy: 5, attack: 3 };
    const result = resolveAttack(summonStats, target.stats, rollDie, 8);
    const remainingHp = Math.max(0, target.hp - result.damage);
    this.setResource('hp', other, remainingHp);
    const ally = this.statuses()[index].buff?.ally ?? owner.character;
    const allyName = this.displayName(ally);
    this.moveMessages.push(`${allyName} attacks! ${result.hit ? `Hit! ${this.displayName(target.character)} takes ${result.damage} damage.` : 'Miss! No damage dealt.'}`);
    this.debugLines.push(
      `Ally: D20(${result.d20}) + Accuracy(5) = ${result.accuracyRoll}; must exceed 8 + Evade(${target.stats.evade}) = ${result.hitThreshold}: ${result.hit ? 'HIT' : 'MISS'}`,
      result.d10 === null ? 'Ally damage: D10 skipped (miss)'
        : `Ally damage: 1 + D10(${result.d10}) + Attack(3) - Defense(${target.stats.defense}) = ${result.attackRoll}; ${result.damage} damage`,
      `Ally target HP: ${target.hp} -> ${remainingHp}`
    );
    if (remainingHp === 0) {
      this.addResult(index === 0 ? 'You win!' : 'You lose!');
      this.finishMove(index);
      return false;
    }
    return true;
  }

  private performMove(index: 0 | 1, intended: CombatAction) {
    this.debugLines = [];
    this.debugModifiers = [];
    this.effectMessage.set('');
    this.resultMessage.set('');
    this.announceMove(index, intended);
    if (!this.beginMove(index)) return;
    if (!this.summonAttack(index)) return;
    let move = intended;
    if (this.statuses()[index].debuff?.type === 'confusion') {
      const d10 = rollDie(10);
      const outcome = confusionOutcome(() => d10);
      this.debugLines.push(`Confusion: D10(${d10}) -> ${outcome} (1: skip, 2-7: random, 8-10: intended)`);
      const name = this.displayName(this.fighters()[index].character);
      if (outcome === 'nothing') {
        this.moveMessages.push(`${this.actorPhrase(this.fighters()[index].character, 'is confused!')}`);
        this.addResult('Does nothing.');
        this.finishMove(index);
        return;
      }
      if (outcome === 'random') {
        const config = index === 0 ? this.playerConfig() : this.opponentConfig();
        // Confusion ignores AI preferences and MP affordability.
        const moves: CombatAction[] = [
          { type: 'fight' }, { type: 'guard' }, { type: 'focus' },
          ...config.specials.map(special => ({ type: 'special' as const, special }))
        ];
        const choice = rollDie(moves.length) - 1;
        move = moves[choice];
        this.debugLines.push(`Random move: D${moves.length}(${choice + 1}) -> ${move.type === 'special' ? move.special.name : move.type}`);
        this.moveMessages.push(`${this.actorPhrase(this.fighters()[index].character, 'is confused and chooses a random move!')}`);
      }
    }
    if (move !== intended) {
      const actualMove = move.type === 'special' ? move.special.name
        : move.type[0].toUpperCase() + move.type.slice(1);
      this.addResult(`${this.displayName(this.fighters()[index].character)} uses ${actualMove}!`);
    }
    if (move.type === 'fight') this.attack(index);
    else if (move.type === 'guard') this.guard(index);
    else if (move.type === 'focus') this.focus(index);
    else if (move.type === 'special') this.useSpecial(index, move.special);
    this.finishMove(index);
    if (index === 0) this.action.emit(move);
  }

  opponentTurn() {
    if (this.isOver() || this.yourTurn()) return;
    this.expireEffects(1);
    let move: CombatAction = this.statuses()[1].debuff?.type === 'mana-drain'
      ? { type: 'fight' } : { type: 'focus' };
    if (this.fighters()[1].mp >= 20) {
      const specials = this.opponentConfig().specials.filter(special =>
        !this.isSilenced(1) &&
        (special.effect !== 'heal' || this.fighters()[1].hp <= this.fighters()[1].stats.hp - 10) &&
        specialAttackRule(special.effect).cost <= this.fighters()[1].mp);
      const choice = rollDie(2 + specials.length) - 1;
      move = choice === 0 ? { type: 'fight' } : choice === 1 ? { type: 'guard' }
        : { type: 'special', special: specials[choice - 2] };
    }
    if (move.type === 'focus' && this.statuses()[1].buff?.type === 'charge') {
      move = { type: 'fight' };
    }
    // Confusion may still override this normal AI decision with any move.
    if (move.type === 'special' && isBuffingMove(move.special.effect) && this.statuses()[1].buff) {
      move = { type: 'fight' };
    }
    this.performMove(1, move);
  }
  readonly playerConfig = computed(() => loadCombatConfig(this.player().id));
  readonly opponentConfig = computed(() => loadCombatConfig(this.opponent().id));

  chooseAction(type: 'fight' | 'guard' | 'focus') {
    if (!this.yourTurn()) return;
    this.performMove(0, { type });
  }

  chooseSpecial(special: SpecialAttack) {
    if (!this.yourTurn()) return;
    this.expireEffects(0);
    if (this.isSilenced(0)) {
      this.addResult('Silenced! Special attacks are disabled.');
      return;
    }
    const configured = this.playerConfig().specials.find(attack => attack === special);
    if (!configured) return;
    if (this.fighters()[0].mp < specialAttackRule(configured.effect).cost) {
      this.addResult(`Not enough MP. ${configured.name} costs ${specialAttackRule(configured.effect).cost} MP.`);
      return;
    }
    this.performMove(0, { type: 'special', special: configured });
  }

  private useSpecial(index: 0 | 1, special: SpecialAttack): boolean {
    if (this.isSilenced(index)) {
      this.debugLines.push('Move blocked: Silence prevents special attacks');
      this.addResult('Silenced! Special attacks are disabled.');
      return false;
    }
    const rule = specialAttackRule(special.effect);
    const currentMp = this.fighters()[index].mp;
    if (currentMp < rule.cost) {
      this.debugLines.push(`Move failed: ${special.name} needs ${rule.cost} MP, available ${currentMp}`);
      this.addResult(`${this.actorPhrase(this.fighters()[index].character, `can't use ${special.name}`)}: not enough MP (${rule.cost} required). Does nothing.`);
      return false;
    }
    this.debugLines.push(`MP cost: ${currentMp} - ${rule.cost} = ${currentMp - rule.cost}`);
    this.setResource('mp', index, currentMp - rule.cost);
    if (special.effect === 'heal') {
      const fighter = this.fighters()[index];
      const d10 = rollDie(10);
      const rolledHealing = 4 + d10;
      const restored = Math.min(rolledHealing, fighter.stats.hp - fighter.hp);
      this.setResource('hp', index, fighter.hp + restored);
      this.addResult(specialAttackMessage(special.effect, this.displayName(fighter.character), fighter.character.pronouns, restored));
      this.debugLines.push(`Heal: 4 + D10(${d10}) = ${rolledHealing}; restored ${restored} HP; HP ${fighter.hp} -> ${fighter.hp + restored} / ${fighter.stats.hp}`);
      return true;
    }
    const boost = statBoosts[special.effect];
    const summon = special.effect === 'summon-ally';
    const charge = special.effect === 'charge';
    const regeneration = special.effect === 'focusing-action';
    let ally: Character | undefined;
    if (summon) {
      const config = index === 0 ? this.playerConfig() : this.opponentConfig();
      const pool = this.characters().length ? this.characters() : [this.player(), this.opponent()];
      ally = pool.find(character => character.id === config.allyId)
        ?? pool[rollDie(pool.length) - 1];
    }
    if (boost || regeneration || charge || summon) {
      this.setStatus(index, { buff: {
        ally,
        type: boost ? boost.type : summon ? 'summon-ally' : charge ? 'charge' : 'mana-regeneration',
        label: boost ? boost.label : summon ? 'Summoned Ally' : charge ? 'Charge' : 'Mana Regeneration',
        expiresAfterMove: this.expiresIn(regeneration ? 12 : summon ? 10 : charge ? 2 : 6)
      } });
      const character = this.fighters()[index].character;
      this.moveMessages.push(specialAttackMessage(special.effect, this.displayName(character), character.pronouns) + (ally ? ` ${this.displayName(ally)} joins the fight!` : ''));
      this.debugLines.push(boost ? `${boost.label}: +2 ${boost.stat}, six turns; no attack roll`
        : summon ? 'Summoned Ally: Accuracy 5, Attack 3, threshold 8 + Evade, 10 turns; starts next owner move'
        : charge ? 'Charge: next attack damage x2, two turns; no attack roll'
        : 'Mana Regeneration: 10% max MP before each move, 12 turns; no attack roll');
      const base = index === 0 ? this.playerConfig().stats : this.opponentConfig().stats;
      this.debugModifiers = combatStatBreakdown(base, this.fighters()[index].stats, this.statuses()[index])
        .filter(row => boost && row.stat === boost.stat)
        .map(row => ({ side: index === 0 ? 'Player' : 'AI', stat: row.stat, calculation: row.calculation }));
    } else this.attack(index, special);
    return true;
  }

  readonly fighters = computed(() => [
    { character: this.player(), label: 'Your character', stats: statusStats(this.playerConfig().stats, this.statuses()[0]), hp: this.hp()[0] ?? this.playerConfig().stats.hp, mp: this.mp()[0] ?? this.playerConfig().stats.mp },
    { character: this.opponent(), label: 'Opponent', stats: statusStats(this.opponentConfig().stats, this.statuses()[1]), hp: this.hp()[1] ?? this.opponentConfig().stats.hp, mp: this.mp()[1] ?? this.opponentConfig().stats.mp }
  ]);

  displayName(character: Character) {
    return character.shortName || character.name;
  }

  tallPortrait(path: string) { return useTallIconAssetPath(path); }

  useUnknownIcon(event: Event) {
    const image = event.currentTarget as HTMLImageElement;
    const fallback = iconAssetPath('extended/Unknown.png');
    if (image.getAttribute('src') !== fallback) image.setAttribute('src', fallback);
  }
}
