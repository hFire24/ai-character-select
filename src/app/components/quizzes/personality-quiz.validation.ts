import { CHARACTER_IDS, QuizContent, SCALE_IDS } from './personality-quiz.types';

export function validateContent(content: QuizContent): { errors: string[]; pending: string[]; ready: boolean } {
  const errors: string[] = [];
  const pending: string[] = [];
  const copy = (value: unknown, slot: string) => {
    if (typeof value !== 'string' || !value.trim() || value.includes('TODO: author content')) pending.push(slot);
  };
  const banks = [content.foundation, content.exploration, content.refinement, content.tiebreakers];
  const expectedCounts = [20, 10, 5, 5];
  const prefixes = ['F', 'E', 'R', 'T'];
  const phases = [1, 2, 3, 'tie'];
  const ids = new Set<string>();
  banks.forEach((bank, index) => {
    if (bank.length !== expectedCounts[index]) errors.push(`${prefixes[index]} requires ${expectedCounts[index]} questions`);
    bank.forEach((question, slot) => {
      const expectedId = `${prefixes[index]}${String(slot + 1).padStart(2, '0')}`;
      if (question.id !== expectedId || ids.has(question.id)) errors.push(`Invalid or duplicate question ID: ${question.id}`);
      ids.add(question.id);
      if (question.phase !== phases[index]) errors.push(`${question.id}: incorrect phase`);
      copy(question.prompt, `${question.id} prompt`);
      if ('options' in question) {
        if (!SCALE_IDS.includes(question.scale)) errors.push(`${question.id}: invalid scale`);
        const values = question.options.map(option => option.value);
        const optionIds = question.options.map(option => option.id);
        if (![2, 3].includes(values.length) || !values.includes(0) || !values.includes(1) ||
            new Set(values).size !== values.length || values.some(value => ![0, 0.5, 1].includes(value)) ||
            optionIds.some(id => !id) || new Set(optionIds).size !== optionIds.length) errors.push(`${question.id}: invalid bipolar options`);
        question.options.forEach(option => copy(option.text, `${question.id}/${option.id}`));
      } else {
        if (Object.keys(question.answers).length !== 9 || Object.keys(question.answers).some(id => !CHARACTER_IDS.includes(id as typeof CHARACTER_IDS[number]))) errors.push(`${question.id}: requires exactly nine character keys`);
        CHARACTER_IDS.forEach(id => copy(question.answers[id], `${question.id}/${id}`));
      }
    });
  });
  for (const scale of SCALE_IDS) {
    if (content.foundation.filter(q => q.scale === scale).length !== 4) errors.push(`${scale}: requires four foundation items`);
    if (content.refinement.filter(q => q.scale === scale).length !== 1) errors.push(`${scale}: requires one refinement item`);
  }
  if (Object.keys(content.results).length !== 9 || Object.keys(content.results).some(id => !CHARACTER_IDS.includes(id as typeof CHARACTER_IDS[number]))) errors.push('Results require exactly nine character keys');
  for (const id of CHARACTER_IDS) {
    for (const field of ['archetype', 'narrative', 'strengths', 'challenges'] as const) copy(content.results[id]?.[field], `result ${id}/${field}`);
  }
  return { errors, pending, ready: errors.length === 0 && pending.length === 0 };
}
