# Personality Girls authoring preview

The Angular route `/quizzes/personality-girls` runs without an API. Each attempt lives in component memory. Back/Next and Review preserve responses and seeded answer order; leaving/reloading the route starts a new attempt. Retake also starts a fresh attempt.

## Author content

Edit `personality-quiz.author.ts`. It provides typed, stable slots; omitted fields retain `TODO: author content` placeholders. No assistant-written question bank or result narrative is approved content.

- `foundation.F01`–`F20`: prompt and two or three `options`. Scales cycle CARE, SOCIAL, IDEAS, CHANGE, HEART four times.
- `exploration.E01`–`E10`: prompt and `answers`, keyed by all nine character IDs. The interface shows four of those answers, without character names as hints.
- `refinement.R01`–`R05`: prompt and two or three `options`, once per scale in the same order.
- `tiebreakers.T01`–`T05`: prompt and nine character-keyed answers. Only the original top tied set is displayed.
- `results`: each character's `archetype`, `narrative`, `strengths`, and `challenges`.

A bipolar slot accepts this shape (these are placeholders, not finished copy):

```ts
F01: {
  prompt: 'TODO: author content',
  options: [
    { id: 'F01-A', text: 'TODO: author content — A', value: 0 },
    { id: 'F01-N', text: 'TODO: author content — neutral', value: 0.5 },
    { id: 'F01-B', text: 'TODO: author content — B', value: 1 }
  ]
}
```

Omit the midpoint for a two-response item. Keep option IDs stable and unique within their question. Values are the right pole position, not points for every character. The owner approves all wording and associations.

Character-keyed slots accept `{ prompt, answers: { crimson, clementine, maria, emerald, maddie, indigo, magenta, cyan, sophia } }`; values are owner-authored strings. Fields may be filled incrementally, but all nine answers must be complete before publication. Do not use the rough concept examples as final copy.

`personality-quiz.content.ts` holds canonical identities, existing art paths, scale labels, and the provisional `SCORING_CONFIG.explorationPointWeight = 1`. It also assembles the authoring slots; `personality-quiz.types.ts` defines the data contract. Test fixtures are in `personality-quiz.fixtures.ts` and are never imported by the application.

## Mechanics

35 main questions: 20 Foundation, 10 Exploration, 5 Refinement. Foundation picks a seeded, reproducible four-girl shortlist, fixed across Exploration. Any Foundation edit that changes its membership warns before clearing Exploration, Refinement, and tie answers. Other main-answer edits clear stale tie state. Answers replace previous choices.

Each dimension averages its five direct observations. Ranking uses all nine eligible girls: base affinity (0–100 points) plus Exploration count times the configured weight. Bars exclude Exploration points. Exact first-place equality triggers all five targeted tie questions; close scores do not. Tie votes leave bars/ranking unchanged. Remaining ties produce co-winners rather than a hidden fallback. The lower HEART pole has no eligible character and is never in a shortlist or tie set.

## Checks

- `npm run build`: reports missing/placeholder copy and structure errors; a valid unfinished preview can build.
- `npm run test:personality-quiz`: headless Chrome scoring, session, and component tests, including two-way and multiway ties.
- `npm run check:personality-quiz`: strict publication readiness, fails for unfinished copy or malformed content.
- `npm run deploy`: now runs the strict readiness check before publishing the site. No deployment was performed.

The UI remains explicitly labeled as authoring preview. Complete and approve the editorial content and review the provisional weight and any desired single-winner fallback before public release. Readiness checks establish completeness, not editorial approval. There is no lint script in this repository.
