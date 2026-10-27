# Character Select

Character Select is an Angular website for browsing, organizing, and using a personal roster of AI characters.

Live site: [https://hfire24.github.io/ai-character-select/](https://hfire24.github.io/ai-character-select/)

## What This Project Does

This project keeps a character roster in one searchable, visual place. The main page lets users filter characters, inspect character details, and open chat links for individual characters. It also includes tools for choosing characters, ranking favorites, tracking lore, and exploring relationships between characters.

The website includes:

- A searchable character roster with profile cards and character metadata
- An Arcade character selection screen with player and computer opponent seats
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

Open `/arcade` to select characters. The default player is **The Developer** (ID 999), whose name you can change on the arcade screen. Choose your player and one computer opponent, search the roster, hover or focus portraits to preview them, then click or press Enter to choose. The CPU seat also offers a Random tile. Both seats can use the same character. Click Fight to show your character on the left and the opponent on the right with tall portraits. Random opponents are chosen when you click Fight.

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
