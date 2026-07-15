# Character Select

Character Select is an Angular website for browsing, organizing, and using a personal roster of AI characters.

Live site: [https://hfire24.github.io/ai-character-select/](https://hfire24.github.io/ai-character-select/)

## What This Project Does

This project keeps a character roster in one searchable, visual place. The main page lets users filter characters, inspect character details, and open chat links for individual characters. It also includes tools for choosing characters, ranking favorites, tracking lore, and exploring relationships between characters.

The website includes:

- A searchable character roster with profile cards and character metadata
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
