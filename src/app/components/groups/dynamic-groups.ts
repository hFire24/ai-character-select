import { Character } from '../../services/character.service';

// Internal to Groups: membership comes from the current character data.
export interface DynamicGroup {
  id: string;
  name: string;
  type: readonly string[];
  description: string;
  characters: Character[];
}

const normalize = (value: string | undefined) => (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const titleCase = (value: string) => value.replace(/\b\w/g, letter => letter.toUpperCase());
const emotionEmoji: Record<string, string> = {
  serious: '🤔',
  chaotic: '🤪',
  joy: '😀',
  happy: '😀',
  cool: '😎',
  strict: '😤',
  angry: '😠',
  shy: '🫣',
  calm: '😌',
  tired: '🥱',
  sad: '☹️',
  edgy: '😈'
};
const emotionLabel = (emotion: string) => {
  const normalized = normalize(emotion);
  const emoji = emotionEmoji[normalized] ?? '';
  return emoji;
};
const emotionList = (emotions: string[]) => emotions.map(emotionLabel).join('');

export function createDynamicGroups(characters: Character[]): DynamicGroup[] {
  const groups: DynamicGroup[] = [];
  const colors = [...new Set(characters.map(character => normalize(character.color)).filter(Boolean))].sort();
  const emotions = [...new Set(characters.flatMap(character =>
    normalize(character.emotion).split(' ').filter(Boolean)))].sort();

  for (const color of colors) {
    groups.push({
      id: `color:${color}`,
      name: titleCase(`${color} characters (dynamic)`),
      type: ['color'],
      description: `Characters whose color is ${color}.`,
      characters: characters.filter(character => normalize(character.color) === color)
    });
  }

  const traits = new Map(characters.map(character => [character, new Set(
    normalize(character.emotion).split(' ').filter(Boolean)
  )]));
  const exact = (character: Character, expected: string[]) => {
    const actual = traits.get(character)!;
    return actual.size === expected.length && expected.every(trait => actual.has(trait));
  };
  const addEmotionGroup = (id: string, name: string, description: string, members: Character[]) => {
    if (members.length) groups.push({ id, name: titleCase(`${name} characters (dynamic)`), type: ['emotion'], description, characters: members });
  };
  const specialPairs: Record<string, string[][]> = {
    joy: [['chaotic', 'joy']],
    chaotic: [['chaotic', 'joy'], ['serious', 'chaotic']],
    calm: [['serious', 'calm']],
    serious: [['serious', 'chaotic'], ['serious', 'calm']]
  };
  const addedPairs = new Set<string>();

  for (const emotion of emotions) {
    const members = characters.filter(character => traits.get(character)!.has(emotion));
    const pure = members.filter(character => exact(character, [emotion]));
    const pairs = specialPairs[emotion] ?? [];
    const exactPairDescription = pairs.length ? pairs.map(pair => emotionList(pair)).join(' or ') : '';
    // Explicitly requested splits are exceptions to the pure-member cutoff.
    if (!pairs.length && pure.length < 5) {
      addEmotionGroup(`emotion:${emotion}`, emotion,
        `Characters with the ${emotionLabel(emotion)} emotion, including mixed emotions.`, members);
      continue;
    }

    addEmotionGroup(`pure-emotion:${emotion}`, `pure ${emotion}`,
      `Characters whose only emotion is ${emotionLabel(emotion)}.`, pure);

    for (const pair of pairs) {
      const pairName = pair.join(' ');
      if (!addedPairs.has(pairName)) {
        addedPairs.add(pairName);
        addEmotionGroup(`exact-emotion:${pair.join('-')}`, pairName,
          `Characters with exactly ${emotionList(pair)} and no other emotions.`,
          characters.filter(character => exact(character, pair)));
      }
    }

    addEmotionGroup(`mixed-emotion:${emotion}`, `mixed ${emotion}`,
      `Characters with ${emotionLabel(emotion)} and other emotions, excluding pure ${emotionLabel(emotion)}${exactPairDescription ? ` and exact ${exactPairDescription}` : ''}.`,
      members.filter(character => !exact(character, [emotion]) && !pairs.some(pair => exact(character, pair))));
  }
  return groups;
}
