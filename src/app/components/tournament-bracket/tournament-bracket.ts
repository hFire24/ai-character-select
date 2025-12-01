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
  @Input() bracketSize: number = 8;
  
  constructor(private characterService: CharacterService) {}
  players: Character[] = [];
  tournamentSeeds: Character[] = [];
  winners: Set<number> = new Set(); // Track winning character IDs
  columns: Character[][] = []; // Organized characters in columns
  round: number = 1;
  tournamentWinner: Character | null = null;
  
  // Standard tournament seeding order for 64 player bracket
  private readonly seedingOrder: number[] = [
    1, 64, 32, 33, 16, 49, 17, 48, 8, 57, 25, 40, 9, 56, 24, 41,
    4, 61, 29, 36, 13, 52, 20, 45, 5, 60, 28, 37, 12, 53, 21, 44,
    2, 63, 31, 34, 15, 50, 18, 47, 7, 58, 26, 39, 10, 55, 23, 42,
    3, 62, 30, 35, 14, 51, 19, 46, 6, 59, 27, 38, 11, 54, 22, 43
  ];

  ngOnInit() {
    // Inject the character service to get characters
    this.characterService.getCharacters().subscribe(characters => {
      const highestTier = Math.max(...characters.map(c => c.tier));

      //Split Liam & Kieran and Riri & Ruru before continuing
      const liamKieranBase = characters.find(c => c.name === 'Liam & Kieran');
      const ririRuruBase = characters.find(c => c.name === 'Riri & Ruru');
      
      const liam = { ...liamKieranBase, name: 'Liam', img: 'Icons/Liam.png', id: 44, shortName: 'Liam' } as Character;
      const kieran = { ...liamKieranBase, name: 'Kieran', img: 'Icons/Kieran.png', id: 45, shortName: 'Kieran' } as Character;
      const riri = { ...ririRuruBase, name: 'Riri', img: 'Icons/Riri.png', id: 52, shortName: 'Riri' } as Character;
      const ruru = { ...ririRuruBase, name: 'Ruru', img: 'Icons/Ruru.png', id: 53, shortName: 'Ruru', tier: characters.find(c => c.shortName === "Aki")?.tier || ririRuruBase?.tier } as Character;

      // Change The Shadow Self's tier to 7
      const changeTierTo7 = (id: number) => {
        const characterIndex = characters.findIndex(c => c.id === id);
        if (characterIndex !== -1) {
          characters[characterIndex] = { ...characters[characterIndex], tier: 7 };
        }
      };

      const tier7Ids = [32, 50];
      tier7Ids.forEach(id => changeTierTo7(id));

      // Group characters by tier (excluding highest tier)
      const charactersByTier = characters
        .filter(a => a.tier !== highestTier && a.name !== 'Liam & Kieran' && a.name !== 'Riri & Ruru')
        .concat([liam, kieran, riri, ruru])
        .reduce((acc, char) => {
          if (!acc[char.tier]) acc[char.tier] = [];
          acc[char.tier].push(char);
          return acc;
        }, {} as Record<number, Character[]>);

      // Shuffle characters within each tier and flatten
      const shuffledCharacters = Object.values(charactersByTier)
        .flatMap(tierCharacters => 
          tierCharacters.sort(() => Math.random() - 0.5)
        );

      this.players = shuffledCharacters.slice(0, this.bracketSize);

      // Filter seeding order based on bracket size
      const filteredSeedingOrder = this.seedingOrder.filter(x => x <= this.bracketSize);

      // Rearrange players based on seeding order
      this.tournamentSeeds = filteredSeedingOrder.map(seedPosition => {
        const playerIndex = seedPosition - 1; // Convert to 0-based index
        if(this.players[playerIndex] && this.round === 1) {
          this.players[playerIndex].seed = seedPosition;
          if(this.round === 1)
            this.players[playerIndex].permaSeed = seedPosition;
        }
        return this.players[playerIndex] || { name: 'BYE', img: 'Icons/Unknown.png', id: -1, shortName: 'BYE', tier: highestTier - 1, seed: seedPosition, permaSeed: seedPosition } as Character;
      });

      // Organize characters into columns
      this.organizeColumns();
    });
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
    const expectedWinners = this.bracketSize / 2;
    return this.winners.size === expectedWinners;
  }
}
