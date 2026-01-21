import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Character, CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-tournament-bracket',
  imports: [CommonModule],
  templateUrl: './tournament-bracket.html',
  styleUrl: './tournament-bracket.scss'
})
export class TournamentBracket implements OnInit {
  @Input() bracketSize: number = 64;
  @Input() selectedIds: number[] = [];
  @Input() seedPreference: 'high' | 'low' = 'high';
  
  constructor(private characterService: CharacterService) {}
  players: Character[] = [];
  tournamentSeeds: Character[] = [];
  winners: Set<number> = new Set(); // Track winning character IDs
  columns: Character[][] = []; // Organized characters in columns
  round: number = 1;
  tournamentWinner: Character | null = null;
  
  ngOnInit() {
    // Inject the character service to get characters
    this.characterService.getCharactersSplitTwins(false).subscribe(characters => {
      const normalizedCharacters = this.normalizeShadowSelfTier([...characters]);
      this.buildBracket(normalizedCharacters);
    });
  }

  private buildBracket(characters: Character[]) {
    const highestTier = Math.max(...characters.map(c => c.tier));
    const fallbackTier = highestTier;

    // Filter out highest-tier characters and any excluded IDs, then sort by moe (high-to-low or low-to-high)
    const available = characters
      .filter(c => c.tier !== highestTier)
      .filter(c => !this.selectedIds.includes(c.id));
    // Group by moe value and shuffle within each group, order groups by moe
    const moeGroups = new Map<number, Character[]>();
    for (const c of available) {
      const key = c.moe;
      const arr = moeGroups.get(key) || [];
      arr.push(c);
      moeGroups.set(key, arr);
    }

    const moeKeys = Array.from(moeGroups.keys()).sort((a, b) =>
      this.seedPreference === 'high' ? b - a : a - b
    );

    const sortedByMoe: Character[] = [];
    for (const key of moeKeys) {
      const group = moeGroups.get(key)!;
      const shuffledGroup = [...group].sort(() => Math.random() - 0.5);
      sortedByMoe.push(...shuffledGroup);
    }

    // Assign seeds based on moe ranking
    this.players = sortedByMoe.slice(0, this.bracketSize).map((char, index) => ({
      ...char,
      seed: index + 1,
      permaSeed: index + 1
    }));

    const playersBySeed = new Map<number, Character>();
    this.players.forEach(p => playersBySeed.set(p.seed as number, p));

    const seedingLayout = this.generateSeedingLayout(this.bracketSize);

    // Place players into bracket positions following the seeding layout
    this.tournamentSeeds = seedingLayout.map(seedNumber => {
      const player = playersBySeed.get(seedNumber);
      return player || {
        name: 'BYE',
        img: 'Icons/extended/Unknown.png',
        id: -1,
        shortName: 'BYE',
        tier: fallbackTier,
        seed: seedNumber,
        permaSeed: seedNumber
      } as Character;
    });

    // Auto-assign winners for BYE matchups
    this.assignByeWins();

    this.organizeColumns();
  }

  private isBye(char: Character | undefined): boolean {
    return !char || char.id === -1 || char.name === 'BYE';
  }

  private assignByeWins(): void {
    for (let i = 0; i < this.tournamentSeeds.length; i += 2) {
      const left = this.tournamentSeeds[i];
      const right = this.tournamentSeeds[i + 1];
      const leftBye = this.isBye(left);
      const rightBye = this.isBye(right);
      if (leftBye && !rightBye) {
        this.winners.add(right.id);
      } else if (rightBye && !leftBye) {
        this.winners.add(left.id);
      }
    }
  }

  private normalizeShadowSelfTier(characters: Character[]): Character[] {
    const shadowSelfId = 50;
    const index = characters.findIndex(c => c.id === shadowSelfId);
    if (index !== -1) {
      characters[index] = { ...characters[index], tier: 7 };
    }
    return characters;
  }

  private generateSeedingLayout(size: number): number[] {
    if (size < 2) return [1];
    let seeds = [1, 2];
    while (seeds.length < size) {
      const max = seeds.length * 2;
      const next: number[] = [];
      for (const seed of seeds) {
        next.push(seed, max - seed + 1);
      }
      seeds = next;
    }
    return seeds.slice(0, size);
  }

  organizeColumns(): void {
    // Use single column for 4 or fewer characters, otherwise use 4 columns
    const numColumns = this.bracketSize <= 4 ? 1 : 4;
    const charactersPerColumn = Math.ceil(this.tournamentSeeds.length / numColumns);
    
    this.columns = [];
    
    if (numColumns === 1) {
      // Single column: put all characters in one column
      this.columns.push([...this.tournamentSeeds]);
    } else {
      // Multi-column layout
      for (let i = 0; i < numColumns; i++) {
        const startIndex = i * charactersPerColumn;
        const endIndex = startIndex + charactersPerColumn;
        this.columns.push(this.tournamentSeeds.slice(startIndex, endIndex));
      }
    }
  }

  assetPath(path: string) {
    return 'assets/' + path;
  }

  isWinner(characterId: number): boolean {
    return this.winners.has(characterId);
  }

  toggleWin(characterId: number): void {
    // Find the index of the clicked character in tournamentSeeds
    const clickedIndex = this.tournamentSeeds.findIndex(char => char.id === characterId);
    
    if (clickedIndex === -1) return; // Character not found
    
    const clickedCharacter = this.tournamentSeeds[clickedIndex];
    
    // Prevent BYE characters from winning
    if (clickedCharacter.id === -1 || clickedCharacter.name === 'BYE') {
      return; // Do nothing if trying to select a BYE
    }
    
    // Determine the opponent's index (pairs are: 0&1, 2&3, 4&5, etc.)
    const opponentIndex = clickedIndex % 2 === 0 ? clickedIndex + 1 : clickedIndex - 1;
    
    // Get the opponent character if it exists
    const opponent = this.tournamentSeeds[opponentIndex];
    
    if (this.winners.has(characterId)) {
      // If clicking on current winner, remove them
      this.winners.delete(characterId);
    } else {
      // If clicking on non-winner, make them winner and remove opponent
      this.winners.add(characterId);
      if (opponent) {
        this.winners.delete(opponent.id);
      }
    }
  }

  createNewBracket() {
    if (!this.allWinnersChosen()) {
      alert(`Please select winners for all matchups. You have selected ${this.winners.size} out of ${this.bracketSize / 2} winners.`);
      return;
    }

    // Get the winning characters in their original order
    const winnerCharacters = this.tournamentSeeds.filter(char => this.winners.has(char.id));

    if (winnerCharacters.length === 1) {
      // Tournament winner found
      this.tournamentWinner = winnerCharacters[0];
      return;
    }
    
    // Update for next round
    this.round++;
    this.bracketSize = winnerCharacters.length;
    this.tournamentSeeds = winnerCharacters;
    this.players = winnerCharacters;
    
    // Re-seed winners for the new bracket
    this.reseedWinners();
    
    // Clear previous winners and reorganize
    this.winners.clear();
    this.organizeColumns();
  }

  reseedWinners() {
    // In a proper tournament bracket, winners advance based on their bracket position, not seed ranking
    // We need to maintain the bracket structure: winners from adjacent pairs should stay together
    
    const newSeeds: Character[] = [];
    
    // Get winners in the order they appear in the current bracket
    for (let i = 0; i < this.tournamentSeeds.length; i++) {
      const character = this.tournamentSeeds[i];
      if (this.winners.has(character.id)) {
        newSeeds.push(character);
      }
    }
    
    // Update seeds for the new bracket
    newSeeds.forEach((char, index) => {
      char.seed = index + 1;
    });
    
    this.tournamentSeeds = newSeeds;
  }

  allWinnersChosen(): boolean {
    // Total expected winners = half the bracket size (includes auto-advanced BYE wins)
    const expectedWinners = this.bracketSize / 2;
    return this.winners.size === expectedWinners;
  }
}
