import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterService } from '../../services/character.service';
import { Character } from '../../services/character.service';
import { DeviceService } from '../../services/device.service';
import { BackButton } from '../back-button/back-button';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-sorter',
  imports: [CommonModule, FormsModule, BackButton],
  templateUrl: './sorter.html',
  styleUrl: './sorter.scss'
})
export class Sorter implements OnInit, OnDestroy {
  characters: Character[] = [];
  genderFilter: string = 'all';
  includeActive: boolean = true;
  includeInactive: boolean = true;
  includeSide: boolean = true;
  includeRetired: boolean = true;
  includeMe: boolean = false;
  isIOS: boolean = false;
  
  // Mode selection
  sortMode: 'ranking' | 'kingOfTheHill' = 'ranking';

  genderAllLabel = '♂️♀️ All';
  genderBoysLabel = '♂️ Boys';
  genderGirlsLabel = '♀️ Girls';
  
  // Sorting state
  isSorting: boolean = false;
  currentPair: [Character, Character] | null = null;
  sortedCharacters: Character[] = [];
  progress: number = 0;
  totalComparisons: number = 0;
  tieGroups: Set<string>[] = []; // Track tied character pairs/groups by ID
  comparisonHistory: Map<string, Map<string, 'greater' | 'less'>> = new Map(); // Track A > B relationships

  // Merge-sort state
  private mergeQueue: Character[][] = [];
  private nextQueue: Character[][] = [];
  private currentMerge: { left: Character[]; right: Character[]; result: Character[] } | null = null;

  // King of the Hill mode
  kingOfTheHillWinner: Character | null = null;
  currentKing: Character | null = null;
  remainingCharacters: Character[] = [];

  // History for back/undo
  private history: Array<{
    characters: Character[];
    mergeQueue: Character[][];
    nextQueue: Character[][];
    currentMerge: { left: Character[]; right: Character[]; result: Character[] } | null;
    isSorting: boolean;
    currentPair: [Character, Character] | null;
    progress: number;
    totalComparisons: number;
    sortedCharacters: Character[];
    tieGroups: Set<string>[];
    comparisonHistory: Map<string, Map<string, 'greater' | 'less'>>;
    // King of the Hill history
    currentKing: Character | null;
    remainingCharacters: Character[];
    kingOfTheHillWinner: Character | null;
  }> = [];

  constructor(private characterService: CharacterService, private deviceService: DeviceService) {
  }

  ngOnInit(): void {
    this.isIOS = this.deviceService.isIOS();
    this.setGenderLabels();
    document.body.classList.add('no-body-padding');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('no-body-padding');
  }

  private setGenderLabels(): void {
    if (this.isIOS) {
      this.genderAllLabel = 'All';
      this.genderBoysLabel = 'Boys';
      this.genderGirlsLabel = 'Girls';
    } else {
      this.genderAllLabel = 'All';
      this.genderBoysLabel = '♂️ Boys';
      this.genderGirlsLabel = '♀️ Girls';
    }
  }


  start(): void {
    this.characterService.getCharactersSplitTwins().subscribe(chars => {
      this.characters = this.filterCharacters(chars);
      
      if (this.characters.length < 2) {
        alert('Not enough characters to sort! Please adjust your filters.');
        return;
      }
      
      if (this.sortMode === 'kingOfTheHill') {
        this.startKingOfTheHill();
      } else {
        // Initialize interactive merge-sort
        const shuffled = this.shuffleArray([...this.characters]);
        this.mergeQueue = shuffled.map(c => [c]);
        this.nextQueue = [];
        this.currentMerge = null;
        this.isSorting = true;
        this.progress = 0;
        this.totalComparisons = Math.ceil(this.characters.length * Math.log2(this.characters.length));
        this.history = [];
        this.tieGroups = [];
        this.comparisonHistory = new Map();

        this.prepareNextMerge();
      }
    });
  }

  private prepareNextMerge(): void {
    // If no active merge, set up the next pair of lists to merge
    if (!this.currentMerge) {
      if (this.mergeQueue.length === 0) {
        // End of pass: if only one list remains in nextQueue, we are done
        if (this.nextQueue.length <= 1) {
          this.sortedCharacters = this.nextQueue[0] || [];
          this.finishSorting();
          return;
        }
        // Start next pass
        this.mergeQueue = this.nextQueue;
        this.nextQueue = [];
      }

      const left = this.mergeQueue.shift()!;
      let right = this.mergeQueue.shift();
      if (!right) {
        // If there's an odd leftover, try to pair it immediately with an existing merged list
        if (this.nextQueue.length > 0) {
          right = this.nextQueue.shift();
        }
      }
      if (!right) {
        // Carry-over odd list if no partner found
        this.nextQueue.push(left);
        this.prepareNextMerge();
        return;
      }
      this.currentMerge = { left, right, result: [] };
    }

    const l = this.currentMerge!.left[0];
    const r = this.currentMerge!.right[0];
    
    if (l && r) {
      // Check if these characters are already tied (transitively)
      if (this.areCharactersTied(l, r)) {
        // Auto-tie without asking user
        const cm = this.currentMerge!;
        cm.result.push(cm.left.shift()!);
        cm.result.push(cm.right.shift()!);
        this.prepareNextMerge();
        return;
      }
      
      // Check if we can infer the result from previous comparisons
      const inferred = this.inferComparison(l, r);
      if (inferred !== null) {
        // Auto-resolve based on transitive relationships
        const cm = this.currentMerge!;
        if (inferred === 'left') {
          cm.result.push(cm.left.shift()!);
        } else {
          cm.result.push(cm.right.shift()!);
        }
        this.prepareNextMerge();
        return;
      }
      
      this.currentPair = [l, r];
    } else {
      // One side empty: append remainder and finalize
      const cm = this.currentMerge!;
      cm.result.push(...cm.left, ...cm.right);
      this.nextQueue.push(cm.result);
      this.currentMerge = null;
      this.prepareNextMerge();
    }
  }

  choose(character: Character): void {
    if (this.sortMode === 'kingOfTheHill') {
      this.chooseKingOfTheHill(character);
      return;
    }
    
    if (!this.currentPair || !this.currentMerge) return;
    this.pushState();
    const [char1, char2] = this.currentPair;
    const cm = this.currentMerge;

    if (character === char1) {
      cm.result.push(cm.left.shift()!);
      this.recordComparison(char1, char2, 'greater');
    } else {
      cm.result.push(cm.right.shift()!);
      this.recordComparison(char2, char1, 'greater');
    }
    this.progress++;
    this.prepareNextMerge();
  }

  chooseTie(): void {
    if (!this.currentPair || !this.currentMerge) return;
    this.pushState();
    const cm = this.currentMerge;
    if (cm.left[0] && cm.right[0]) {
      const char1 = cm.left[0];
      const char2 = cm.right[0];
      
      // Find existing tie groups for both characters
      let group1 = this.tieGroups.find(g => g.has(char1.id.toString()));
      let group2 = this.tieGroups.find(g => g.has(char2.id.toString()));
      
      if (group1 && group2 && group1 !== group2) {
        // Merge the two groups
        group2.forEach(id => group1!.add(id));
        this.tieGroups = this.tieGroups.filter(g => g !== group2);
      } else if (group1) {
        // Add char2 to existing group
        group1.add(char2.id.toString());
      } else if (group2) {
        // Add char1 to existing group
        group2.add(char1.id.toString());
      } else {
        // Create new tie group
        const tieGroup = new Set<string>([char1.id.toString(), char2.id.toString()]);
        this.tieGroups.push(tieGroup);
      }
      
      cm.result.push(cm.left.shift()!);
      cm.result.push(cm.right.shift()!);
      this.progress++;
    }
    this.prepareNextMerge();
  }

  private finishSorting(): void {
    this.isSorting = false;
    this.currentPair = null;
    this.mergeQueue = [];
    this.nextQueue = [];
    this.currentMerge = null;
  }

  // scoring-based finish removed; interactive merge-sort produces sortedCharacters

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  back(): void {
    if (!this.history.length) return;
    const s = this.history.pop()!;
    this.characters = [...s.characters];
    this.mergeQueue = s.mergeQueue.map(list => [...list]);
    this.nextQueue = s.nextQueue.map(list => [...list]);
    this.currentMerge = s.currentMerge
      ? { left: [...s.currentMerge.left], right: [...s.currentMerge.right], result: [...s.currentMerge.result] }
      : null;
    this.isSorting = s.isSorting;
    this.currentPair = s.currentPair ? [s.currentPair[0], s.currentPair[1]] : null;
    this.progress = s.progress;
    this.totalComparisons = s.totalComparisons;
    this.sortedCharacters = [...s.sortedCharacters];
    this.tieGroups = s.tieGroups.map(g => new Set<string>(g));
    this.comparisonHistory = new Map();
    s.comparisonHistory.forEach((inner, k) => {
      this.comparisonHistory.set(k, new Map(inner));
    });
    this.currentKing = s.currentKing;
    this.remainingCharacters = [...s.remainingCharacters];
    this.kingOfTheHillWinner = s.kingOfTheHillWinner;
  }

  canGoBack(): boolean {
    return this.history.length > 0;
  }

  getDisplayRank(index: number, char: Character): number {
    // Check if current character is tied with previous
    if (index > 0) {
      const prevChar = this.sortedCharacters[index - 1];
      const isTied = this.tieGroups.some(group => 
        group.has(char.id.toString()) && group.has(prevChar.id.toString())
      );
      if (isTied) {
        return this.getDisplayRank(index - 1, prevChar);
      }
    }
    return index + 1;
  }

  private areCharactersTied(char1: Character, char2: Character): boolean {
    return this.tieGroups.some(group => 
      group.has(char1.id.toString()) && group.has(char2.id.toString())
    );
  }

  private recordComparison(winner: Character, loser: Character, relation: 'greater' | 'less'): void {
    // Record direct comparison
    if (!this.comparisonHistory.has(winner.id.toString())) {
      this.comparisonHistory.set(winner.id.toString(), new Map());
    }
    this.comparisonHistory.get(winner.id.toString())!.set(loser.id.toString(), 'greater');
    
    if (!this.comparisonHistory.has(loser.id.toString())) {
      this.comparisonHistory.set(loser.id.toString(), new Map());
    }
    this.comparisonHistory.get(loser.id.toString())!.set(winner.id.toString(), 'less');
    
    // Also record for all tied characters
    const winnerTieGroup = this.tieGroups.find(g => g.has(winner.id.toString()));
    const loserTieGroup = this.tieGroups.find(g => g.has(loser.id.toString()));
    
    if (winnerTieGroup) {
      winnerTieGroup.forEach(tiedId => {
        if (tiedId !== winner.id.toString()) {
          if (!this.comparisonHistory.has(tiedId)) {
            this.comparisonHistory.set(tiedId, new Map());
          }
          this.comparisonHistory.get(tiedId)!.set(loser.id.toString(), 'greater');
          if (loserTieGroup) {
            loserTieGroup.forEach(lTiedId => {
              this.comparisonHistory.get(tiedId)!.set(lTiedId, 'greater');
            });
          }
        }
      });
    }
    
    if (loserTieGroup) {
      loserTieGroup.forEach(tiedId => {
        if (tiedId !== loser.id.toString()) {
          if (!this.comparisonHistory.has(tiedId)) {
            this.comparisonHistory.set(tiedId, new Map());
          }
          this.comparisonHistory.get(tiedId)!.set(winner.id.toString(), 'less');
          if (winnerTieGroup) {
            winnerTieGroup.forEach(wTiedId => {
              this.comparisonHistory.get(tiedId)!.set(wTiedId, 'less');
            });
          }
        }
      });
    }
  }

  private inferComparison(char1: Character, char2: Character): 'left' | 'right' | null {
    // Check direct comparison
    const char1Relations = this.comparisonHistory.get(char1.id.toString());
    if (char1Relations) {
      const relation = char1Relations.get(char2.id.toString());
      if (relation === 'greater') return 'left';
      if (relation === 'less') return 'right';
    }
    
    // Check transitive: if char1 > X and X > char2, then char1 > char2
    if (char1Relations) {
      for (const [intermediateId, relation1] of char1Relations.entries()) {
        if (relation1 === 'greater') {
          const intermediateRelations = this.comparisonHistory.get(intermediateId);
          if (intermediateRelations) {
            const relation2 = intermediateRelations.get(char2.id.toString());
            if (relation2 === 'greater') {
              return 'left'; // char1 > intermediate > char2, so char1 > char2
            }
          }
        }
      }
    }
    
    // Check reverse transitive: if char2 > X and X > char1, then char2 > char1
    const char2Relations = this.comparisonHistory.get(char2.id.toString());
    if (char2Relations) {
      for (const [intermediateId, relation1] of char2Relations.entries()) {
        if (relation1 === 'greater') {
          const intermediateRelations = this.comparisonHistory.get(intermediateId);
          if (intermediateRelations) {
            const relation2 = intermediateRelations.get(char1.id.toString());
            if (relation2 === 'greater') {
              return 'right'; // char2 > intermediate > char1, so char2 > char1
            }
          }
        }
      }
    }
    
    return null;
  }

  private pushState(): void {
    const comparisonCopy = new Map<string, Map<string, 'greater' | 'less'>>();
    this.comparisonHistory.forEach((inner, k) => {
      comparisonCopy.set(k, new Map(inner));
    });

    this.history.push({
      characters: [...this.characters],
      mergeQueue: this.mergeQueue.map(list => [...list]),
      nextQueue: this.nextQueue.map(list => [...list]),
      currentMerge: this.currentMerge
        ? { left: [...this.currentMerge.left], right: [...this.currentMerge.right], result: [...this.currentMerge.result] }
        : null,
      isSorting: this.isSorting,
      currentPair: this.currentPair ? [this.currentPair[0], this.currentPair[1]] : null,
      progress: this.progress,
      totalComparisons: this.totalComparisons,
      sortedCharacters: [...this.sortedCharacters],
      tieGroups: this.tieGroups.map(g => new Set<string>(g)),
      comparisonHistory: comparisonCopy,
      currentKing: this.currentKing,
      remainingCharacters: [...this.remainingCharacters],
      kingOfTheHillWinner: this.kingOfTheHillWinner,
    });
  }

  private filterCharacters(chars: Character[]): Character[] {
    return chars.filter(char => {
      // Filter out future character
      if (char.type === 'future') {
        return false;
      }

      // Filter by gender
      if (this.genderFilter === 'boys' && char.pronouns === 'she/her') {
        return false;
      }
      if (this.genderFilter === 'girls' && char.pronouns !== 'she/her') {
        return false;
      }

      // Filter by character type using checkboxes
      const matchesActive = this.includeActive && char.type === 'active';
      const matchesInactive = this.includeInactive && char.type === 'inactive';
      const matchesSide = this.includeSide && char.type === 'side';
      const matchesRetired = this.includeRetired && char.type === 'retired';
      const matchesMe = this.includeMe && char.type === 'me';
      
      return matchesActive || matchesInactive || matchesSide || matchesRetired || matchesMe;
    });
  }

  async takeScreenshot(): Promise<void> {
    const rankingList = document.querySelector('.ranking-list') as HTMLElement;
    if (!rankingList) {
      alert('Could not find ranking list to screenshot.');
      return;
    }

    try {
      const canvas = await html2canvas(rankingList, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `character-rankings-${new Date().getTime()}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error taking screenshot:', error);
      alert('Failed to take screenshot. Please try again.');
    }
  }

  // King of the Hill Methods
  startKingOfTheHill(): void {
    const shuffled = this.shuffleArray([...this.characters]);
    this.currentKing = shuffled[0];
    this.remainingCharacters = shuffled.slice(1);
    this.isSorting = true;
    this.progress = 0;
    this.totalComparisons = this.characters.length - 1;
    this.history = [];
    this.kingOfTheHillWinner = null;
    
    if (this.remainingCharacters.length > 0) {
      this.currentPair = [this.currentKing, this.remainingCharacters[0]];
    } else {
      // Only one character total
      this.kingOfTheHillWinner = this.currentKing;
      this.isSorting = false;
    }
  }

  chooseKingOfTheHill(character: Character): void {
    if (!this.currentPair) return;
    this.pushState();
    
    const [king, challenger] = this.currentPair;
    
    if (character === king) {
      // King wins, stays as king
      this.currentKing = king;
    } else {
      // Challenger wins, becomes new king
      this.currentKing = challenger;
    }
    
    // Remove the challenger from remaining characters
    this.remainingCharacters.shift();
    this.progress++;
    
    // Check if there are more challengers
    if (this.remainingCharacters.length > 0) {
      this.currentPair = [this.currentKing, this.remainingCharacters[0]];
    } else {
      // No more challengers, current king is the winner
      this.kingOfTheHillWinner = this.currentKing;
      this.isSorting = false;
      this.currentPair = null;
    }
  }

  resetKingOfTheHill(): void {
    this.kingOfTheHillWinner = null;
    this.currentKing = null;
    this.remainingCharacters = [];
    this.isSorting = false;
    this.currentPair = null;
    this.sortedCharacters = [];
  }
}
