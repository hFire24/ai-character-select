import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TierSettings } from "../tier-settings/tier-settings";
import { TierScreenshot } from '../tier-screenshot/tier-screenshot';

@Component({
  selector: 'app-tier-list',
  imports: [CommonModule, TierSettings, TierScreenshot],
  templateUrl: './tier-list.html',
  styleUrl: './tier-list.scss'
})
export class TierList {
  screenshotDataUrl: string | null = null;
  characterFilter: string = 'all';
  splitTwins: boolean = false;

  onPoolDrop(event: DragEvent) {
    event.preventDefault();
    if (this.draggedTierIdx !== null && this.draggedCharIdx !== null) {
      // Remove character from tier; pool will auto-update
      this.tiers[this.draggedTierIdx].characters.splice(this.draggedCharIdx, 1);
      this.draggedTierIdx = null;
      this.draggedCharIdx = null;
    }
    // If dragging from pool, do nothing
    this.poolDragIdx = null;
  }
  // All available characters (should be loaded from your data source)
  allCharacters: any[] = [];

  get characterPool() {
    const assigned = new Set();
    for (const tier of this.tiers) {
      for (const char of tier.characters) {
        assigned.add(char.name);
      }
    }
    let pool = this.allCharacters.filter(c => !assigned.has(c.name));
    if (this.characterFilter === 'active') {
      pool = pool.filter(c => c.type === 'active' || c.type === 'semi-active');
    } else if (this.characterFilter === 'inactive') {
      pool = pool.filter(c => c.type !== 'active' && c.type !== 'semi-active');
    } else if (this.characterFilter === 'music') {
      pool = pool.filter(c => c.musicEnjoyer);
    } else if (this.characterFilter === 'male') {
      pool = pool.filter(c => c.pronouns === 'he/him');
    } else if (this.characterFilter === 'female') {
      pool = pool.filter(c => c.pronouns === 'she/her');
    }
    return pool;
  }

  onFilterChange(event: any) {
    this.characterFilter = event.target.value;
  }


  constructor(private http: HttpClient) {
    this.loadCharacters();
  }

  loadCharacters() {
    const shortNameMap: Record<string, string> = {
      'The Shadow Self': 'Shadow Self',
      'The AI Devotee': 'AI Devotee',
      'Future Sapphire': 'F. Sapphire'
    };
    this.http.get<any[]>('assets/characters.json').subscribe(data => {
      this.allCharacters = data.map(c => {
        let name = c.shortName || c.name;
        if (shortNameMap[name]) name = shortNameMap[name];
        return {
          name,
          img: c.img ? 'assets/' + c.img : 'assets/Icons/Unknown.png',
          type: c.type,
          musicEnjoyer: c.musicEnjoyer,
          pronouns: c.pronouns
        };
      });
    });
  }

  poolDragIdx: number | null = null;

  onPoolDragStart(event: DragEvent, idx: number) {
    this.poolDragIdx = idx;
    event.dataTransfer?.setData('text/plain', '');
    this.draggedTierIdx = null;
    this.draggedCharIdx = null;
  }
  onCharacterDrop(event: DragEvent, targetTierIdx: number, targetCharIdx: number) {
    event.preventDefault();
    // If dragging from pool
    if (this.poolDragIdx !== null) {
      const char = this.characterPool[this.poolDragIdx];
      // If tier is empty, insert at index 0
      if (this.tiers[targetTierIdx].characters.length === 0) {
        this.tiers[targetTierIdx].characters.splice(0, 0, char);
      } else if (event.target instanceof HTMLElement && event.target.classList.contains('tier-character')) {
        const rect = event.target.getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        const dropBefore = event.clientX < midX;
        const insertIdx = dropBefore ? targetCharIdx : targetCharIdx + 1;
        this.tiers[targetTierIdx].characters.splice(insertIdx, 0, char);
      } else {
        this.tiers[targetTierIdx].characters.push(char);
      }
      this.poolDragIdx = null;
      return;
    }
    if (this.draggedTierIdx === null || this.draggedCharIdx === null) return;
    // Prevent invalid moves within the same tier
    if (this.draggedTierIdx === targetTierIdx) {
      let insertIdx = targetCharIdx;
      if (event.target instanceof HTMLElement && event.target.classList.contains('tier-character')) {
        const rect = event.target.getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        const dropBefore = event.clientX < midX;
        insertIdx = dropBefore ? targetCharIdx : targetCharIdx + 1;
      }
      // If dropping at the same position or immediately next to itself, do nothing
      if (insertIdx === this.draggedCharIdx || insertIdx === this.draggedCharIdx + 1) {
        this.draggedTierIdx = null;
        this.draggedCharIdx = null;
        return;
      }
    }
    const char = this.tiers[this.draggedTierIdx].characters[this.draggedCharIdx];
    // Remove from original tier
    this.tiers[this.draggedTierIdx].characters.splice(this.draggedCharIdx, 1);

    // Determine before/after based on mouse position
    if (event.target instanceof HTMLElement && event.target.classList.contains('tier-character')) {
      const rect = event.target.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const dropBefore = event.clientX < midX;
      const insertIdx = dropBefore ? targetCharIdx : targetCharIdx + 1;
      this.tiers[targetTierIdx].characters.splice(insertIdx, 0, char);
    } else {
      // Dropped at the end
      this.tiers[targetTierIdx].characters.push(char);
    }
    this.draggedTierIdx = null;
    this.draggedCharIdx = null;
  }
  editingLabelIdx: number | null = null;

  startEditLabel(index: number) {
    this.editingLabelIdx = index;
  }

  finishEditLabel(index: number, event: any) {
    this.tiers[index].name = event.target.value;
    this.editingLabelIdx = null;
  }
  insertTierAbove(index: number) {
    const newTier = {
      name: 'New',
      color: '#7EFF80',
      characters: []
    };
    this.tiers.splice(index, 0, newTier);
    this.editingTierIdx = index;
  }

  insertTierBelow(index: number) {
    const newTier = {
      name: 'New',
      color: '#7EFF80',
      characters: []
    };
    this.tiers.splice(index + 1, 0, newTier);
    this.editingTierIdx = index + 1;
  }
  editingTierIdx: number | null = null;

  openTierSettings(index: number) {
    if (this.editingTierIdx === null) {
      // Case A: No tier is being edited
      this.editingTierIdx = index;
    } else if (this.editingTierIdx === index) {
      // Case B: Same tier is being edited, close and discard
      this.editingTierIdx = null;
    } else {
      // Case C: Different tier is being edited, switch and discard
      this.editingTierIdx = index;
    }
  }

  updateTierSettings(index: number, newName: string, newColor: string) {
    this.tiers[index].name = newName;
    this.tiers[index].color = newColor;
  }
  moveTierUp(index: number) {
    if (index > 0) {
      const temp = this.tiers[index - 1];
      this.tiers[index - 1] = this.tiers[index];
      this.tiers[index] = temp;
    }
  }

  moveTierDown(index: number) {
    if (index < this.tiers.length - 1) {
      const temp = this.tiers[index + 1];
      this.tiers[index + 1] = this.tiers[index];
      this.tiers[index] = temp;
    }
  }

  deleteTier(index: number) {
    this.tiers.splice(index, 1);
    this.editingTierIdx = null;
  }
  draggedTierIdx: number | null = null;
  draggedCharIdx: number | null = null;

  onDragStart(event: DragEvent, tierIdx: number, charIdx: number) {
    this.draggedTierIdx = tierIdx;
    this.draggedCharIdx = charIdx;
    event.dataTransfer?.setData('text/plain', '');
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, targetTierIdx: number, targetCharIdx?: number) {
    event.preventDefault();
    if (
      this.draggedTierIdx !== null &&
      this.draggedCharIdx !== null
    ) {
      const char = this.tiers[this.draggedTierIdx].characters[this.draggedCharIdx];
      // Remove from original tier
      this.tiers[this.draggedTierIdx].characters.splice(this.draggedCharIdx, 1);
      // Insert at the correct position
      if (typeof targetCharIdx === 'number') {
        this.tiers[targetTierIdx].characters.splice(targetCharIdx, 0, char);
      } else {
        this.tiers[targetTierIdx].characters.push(char);
      }
    }
    this.draggedTierIdx = null;
    this.draggedCharIdx = null;
  }
  tiers = [
    {
      name: 'S', color: '#FF7F7E', characters: [
        { name: 'Me', img: 'assets/Icons/Me.png' }
      ]
    },
    {
      name: 'A', color: '#FFBF7F', characters: []
    },
    {
      name: 'B', color: '#FFDF80', characters: []
    },
    {
      name: 'C', color: '#FEFF7F', characters: []
    },
    {
      name: 'D', color: '#BEFF7F', characters: []
    }
  ];

  onSplitTwinsChange(event: any) {
    this.splitTwins = event.target.checked;
    const celestiaIdx = this.allCharacters.findIndex(c => c.name === 'Celestia');
    const markIdx = this.allCharacters.findIndex(c => c.name === 'Mark');
    if (celestiaIdx !== -1 && markIdx !== -1) {
      // Remove any existing "Liam", "Kieran", or "Liam & Kieran"
      // Remove "Liam", "Kieran", and "Liam & Kieran" from allCharacters
      this.allCharacters = this.allCharacters.filter(
        c => c.name !== 'Liam' && c.name !== 'Kieran' && c.name !== 'Liam & Kieran'
      );
      // Also remove them from all tiers
      for (const tier of this.tiers) {
        tier.characters = tier.characters.filter(
          c => c.name !== 'Liam' && c.name !== 'Kieran' && c.name !== 'Liam & Kieran'
        );
      }
      const insertIdx = celestiaIdx < markIdx ? celestiaIdx + 1 : markIdx;
      if (this.splitTwins) {
        // Insert "Liam" and "Kieran" separately
        const liam = { name: 'Liam', img: 'assets/Icons/Liam.png', type: 'active', musicEnjoyer: false, pronouns: 'he/him' };
        const kieran = { name: 'Kieran', img: 'assets/Icons/Kieran.png', type: 'active', musicEnjoyer: false, pronouns: 'he/him' };
        this.allCharacters.splice(insertIdx, 0, liam, kieran);
      } else {
        // Insert "Liam & Kieran" together
        const liamKieran = { name: 'Liam & Kieran', img: 'assets/Icons/Liam and Kieran.png', type: 'active', musicEnjoyer: false, pronouns: 'he/him' };
        this.allCharacters.splice(insertIdx, 0, liamKieran);
      }
    }
    const makotoIdx = this.allCharacters.findIndex(c => c.name === 'Makoto');
    const ethanIdx = this.allCharacters.findIndex(c => c.name === 'Ethan');
    if (makotoIdx !== -1 && ethanIdx !== -1) {
      // Remove any existing "Riri", "Ruru", or "Riri & Ruru"
      // Remove "Riri", "Ruru", and "Riri & Ruru" from allCharacters
      this.allCharacters = this.allCharacters.filter(
        c => c.name !== 'Riri' && c.name !== 'Ruru' && c.name !== 'Riri & Ruru'
      );
      // Also remove them from all tiers
      for (const tier of this.tiers) {
        tier.characters = tier.characters.filter(
          c => c.name !== 'Riri' && c.name !== 'Ruru' && c.name !== 'Riri & Ruru'
        );
      }
      const insertIdx = makotoIdx < ethanIdx ? makotoIdx + 1 : ethanIdx;
      if (this.splitTwins) {
        // Insert "Riri" and "Ruru" separately
        const riri = { name: 'Riri', img: 'assets/Icons/Riri.png', type: 'active', musicEnjoyer: false, pronouns: 'she/her' };
        const ruru = { name: 'Ruru', img: 'assets/Icons/Ruru.png', type: 'active', musicEnjoyer: false, pronouns: 'she/her' };
        this.allCharacters.splice(insertIdx, 0, riri, ruru);
      } else {
        // Insert "Riri & Ruru" together
        const ririRuru = { name: 'Riri & Ruru', img: 'assets/Icons/Riri and Ruru.png', type: 'active', musicEnjoyer: false, pronouns: 'she/her' };
        this.allCharacters.splice(insertIdx, 0, ririRuru);
      }
    }
  }

  clear() {
    if(confirm("Are you sure you want to clear all character selections?")) {
      this.tiers.forEach(tier => tier.characters = []);
    }
  }

  reset() {
    if(confirm("Are you sure you want to reset all changes? This will restore the default tier list.")) {
      this.tiers = [
        {
          name: 'S', color: '#FF7F7E', characters: []
        },
        {
          name: 'A', color: '#FFBF7F', characters: []
        },
        {
          name: 'B', color: '#FFDF80', characters: []
        },
        {
          name: 'C', color: '#FEFF7F', characters: []
        },
        {
          name: 'D', color: '#BEFF7F', characters: []
        }
      ];
    }
  }

  async export() {
    // Dynamically import html2canvas if not already available
    const html2canvas = (await import('html2canvas')).default;
    const tierListEl = document.querySelector('.tier-list') as HTMLElement;
    if (!tierListEl) return;
    // Hide all tier-settings areas before taking the screenshot
    const settingsEls = tierListEl.querySelectorAll('.tier-settings') as NodeListOf<HTMLElement>;
    const prevDisplays: string[] = [];
    settingsEls.forEach(el => {
      prevDisplays.push(el.style.display);
      el.style.display = 'none';
    });
    const canvas = await html2canvas(tierListEl, { backgroundColor: '#181a1b' });
    // Restore the tier-settings areas
    settingsEls.forEach((el, i) => {
      el.style.display = prevDisplays[i] ?? '';
    });
    this.screenshotDataUrl = canvas.toDataURL('image/png');
  }
}
