# Character Select

Character Select is an Angular website for browsing, organizing, and using a personal roster of AI characters.

Live site: [https://hfire24.github.io/ai-character-select/](https://hfire24.github.io/ai-character-select/)

## What This Project Does

This project keeps a character roster in one searchable, visual place. The main page lets users filter characters, inspect character details, and open chat links for individual characters. It also includes tools for choosing characters, ranking favorites, tracking lore, and exploring relationships between characters.

The website includes:

- A searchable character roster with profile cards and character metadata
- An Arcade with playable Farkle, selectable characters, and random computer opponents
- Random character selection for roleplay-friendly characters, answer-friendly characters, or the full roster
- Ranking tools including a tier list, comparison sorter, tournament bracket, and blind ranking
- Character relationship pages for duos, trios, groups, and lineage
- Roster utilities such as stats, birthday calendar, timeline, ID checker, hangouts, and story helper
- A small .NET backend used by some management features, including custom duo names

## Tech Stack

- Angular 20
- TypeScript
- SCSS
- .NET 8 Web API backend

## Getting Started

Install dependencies:

```bash
npm install
```

Start the Angular development server:

```bash
npm start
```

Open [http://localhost:4200/](http://localhost:4200/) in your browser.

To run the frontend and backend together:

```bash
npm run dev
```

The backend runs on [http://localhost:3001/](http://localhost:3001/).

## Arcade

Open `/arcade` to play Farkle. The default player is the roster's **Me** (ID 999), with two distinct random character opponents. Select a player or CPU seat, hover or focus portraits to preview them, then click or press Enter to choose. CPU seats also offer a Random tile. Choose one to three opponents and a 5,000 or 10,000 point target. The rules panel lists this Arcade's scoring variant.

Games work without an AI connection. To enable generated character reactions locally, set `OPENAI_API_KEY` and `ARCADE_DIALOGUE_MODEL` in the backend process environment, then run `npm run dev`. Choose a text model available to your API account. Never put the key in frontend files. Requests send the reacting character's name, description, interests, game event, and scoreboard. Dialogue does not control dice, scoring, or computer decisions.

The dialogue endpoint accepts loopback requests in Development only. GitHub Pages uses built-in reactions; generated dialogue on a published site needs a separately hosted, authenticated backend. Built-in reactions also appear when the AI service fails.

Integration reference: [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create).

Run `npm run check:arcade` for scoring and turn-transition checks.

## Useful Commands

Build the site:

```bash
npm run build
```

Run unit tests:

```bash
npm test
```

Deploy to GitHub Pages:

```bash
npm run deploy
```

The production build is configured for the `/ai-character-select/` base path.
