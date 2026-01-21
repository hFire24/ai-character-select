import { Component } from '@angular/core';
import { CharacterService } from '../../services/character.service';
import { CommonModule } from '@angular/common';
import { TierSettings } from "../tier-settings/tier-settings";
import { TierScreenshot } from '../tier-screenshot/tier-screenshot';
import { TextViewer } from '../text-viewer/text-viewer';
import { BackButton } from '../back-button/back-button';

@Component({
  selector: 'app-tier-list',
  imports: [CommonModule, TierSettings, TierScreenshot, TextViewer, BackButton],
  templateUrl: './tier-list.html',
  styleUrl: './tier-list.scss'
})
export class TierList {
  screenshotDataUrl: string | null = null;
  characterFilter: string = 'all';
  splitTwins: boolean = false;
  router: any;
  selectedPoolCharIdx: number | null = null;
  selectedTierCharIdx: { tierIdx: number; charIdx: number } | null = null;

  get textViewerContent(): string {
    let text = '';
    this.tiers.forEach(tier => {
      const characterNames = tier.characters.map(char => char.name).join(', ');
      text += `${tier.name}: ${characterNames}\n`;
    });
    return text.trim();
  }

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
      pool = pool.filter(c => c.type === 'active');
    } else if (this.characterFilter === 'retired') {
      pool = pool.filter(c => c.type === 'retired' || c.type === 'inactive');
    } else if (this.characterFilter === 'music') {
      pool = pool.filter(c => c.musicEnjoyer);
    } else if (this.characterFilter === 'side') {
      pool = pool.filter(c => (c.type === 'side' || c.type === 'side retired') && !c.musicEnjoyer);
    } else if (this.characterFilter === 'male') {
      pool = pool.filter(c => c.pronouns !== 'she/her');
    } else if (this.characterFilter === 'female') {
      pool = pool.filter(c => c.pronouns === 'she/her');
    }
    return pool;
  }

  onFilterChange(event: any) {
    this.characterFilter = event.target.value;
  }

  constructor(private characterService: CharacterService) {
    this.loadCharacters();
  }

  private loadCharacters() {
    const shortNameMap: Record<string, string> = {
      'The Indulgent': 'Indulgent',
      'Future Sapphire': 'F. Sapphire',
      'The Collapsed': 'Collapsed'
    };
    const source$ = this.splitTwins
      ? this.characterService.getCharactersSplitTwins()
      : this.characterService.getCharacters();
    source$.subscribe(data => {
      this.allCharacters = data.map(c => {
        let name = c.shortName || c.name;
        if (shortNameMap[name]) name = shortNameMap[name];
        return {
          name,
          img: c.img ? 'assets/' + c.img : 'assets/Icons/extended/Unknown.png',
          id: c.id,
          type: c.type,
          tier: c.tier,
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

  togglePoolCharacterSelection(idx: number) {
    if (this.selectedPoolCharIdx === idx) {
      this.selectedPoolCharIdx = null;
    } else {
      this.selectedPoolCharIdx = idx;
      this.selectedTierCharIdx = null;
    }
  }

  moveSelectedTierCharacterToPool(poolCharIdx: number) {
    // Only allow moving tier characters to pool
    if (this.selectedTierCharIdx === null) return;

    const sourceTierIdx = this.selectedTierCharIdx.tierIdx;
    const sourceCharIdx = this.selectedTierCharIdx.charIdx;
    
    // Remove character from tier
    this.tiers[sourceTierIdx].characters.splice(sourceCharIdx, 1);
    
    this.selectedTierCharIdx = null;
  }

  toggleTierCharacterSelection(tierIdx: number, charIdx: number) {
    if (
      this.selectedTierCharIdx?.tierIdx === tierIdx &&
      this.selectedTierCharIdx?.charIdx === charIdx
    ) {
      this.selectedTierCharIdx = null;
    } else {
      this.selectedTierCharIdx = { tierIdx, charIdx };
      this.selectedPoolCharIdx = null;
    }
  }

  placeSelectedCharacterInTierAtIndex(tierIdx: number, insertIdx: number) {
    let char: any = null;

    if (this.selectedPoolCharIdx !== null) {
      char = this.characterPool[this.selectedPoolCharIdx];
      this.tiers[tierIdx].characters.splice(insertIdx, 0, char);
      this.selectedPoolCharIdx = null;
    } else if (this.selectedTierCharIdx !== null) {
      const sourceTierIdx = this.selectedTierCharIdx.tierIdx;
      const sourceCharIdx = this.selectedTierCharIdx.charIdx;
      char = this.tiers[sourceTierIdx].characters[sourceCharIdx];
      
      if (sourceTierIdx === tierIdx) {
        // Moving within the same tier
        // Don't move if clicking the same character
        if (sourceCharIdx === insertIdx) {
          this.selectedTierCharIdx = null;
          return;
        }
        
        // Remove from source
        this.tiers[sourceTierIdx].characters.splice(sourceCharIdx, 1);
        
        // Adjust insert index if we removed from before the insert point
        const adjustedIdx = sourceCharIdx < insertIdx ? insertIdx - 1 : insertIdx;
        
        // Insert at new position
        this.tiers[tierIdx].characters.splice(adjustedIdx, 0, char);
      } else {
        // Moving from different tier
        this.tiers[sourceTierIdx].characters.splice(sourceCharIdx, 1);
        this.tiers[tierIdx].characters.splice(insertIdx, 0, char);
      }
      
      this.selectedTierCharIdx = null;
    }
  }

  placeSelectedCharacterInTier(tierIdx: number) {
    // Append to the end if clicking the tier container
    const insertIdx = this.tiers[tierIdx].characters.length;
    this.placeSelectedCharacterInTierAtIndex(tierIdx, insertIdx);
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
        { name: 'Me', img: 'assets/Icons/extended/Me.png', id: 0 }
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
    // Reload characters from the service based on current splitTwins state
    this.loadCharacters();
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

  async import() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.json')) {
        alert('Please select a JSON file.');
        return;
      }

      try {
        const text = await file.text();
        const metadata = JSON.parse(text);
        await this.restoreTierListFromMetadata(metadata);
      } catch (error) {
        alert('Error importing tier list: Invalid JSON file. ' + error);
      }
    };
    input.click();
  }

  private findAndAddCharactersToTier(tierIndex: number, charactersMetadata: any[]) {
    charactersMetadata.forEach((charMeta: any) => {
      let character = this.allCharacters.find(c => c.id === charMeta.id);
      if (!character) {
        // Fallback to name matching if ID not found
        character = this.allCharacters.find(c => c.name === charMeta.name);
      }
      if (character) {
        this.tiers[tierIndex].characters.push(character);
      }
    });
  }

  private async restoreTierListFromMetadata(metadata: any) {
    if (!metadata || !metadata.tiers) {
      alert('Invalid tier list file format.');
      return;
    }

    if (confirm('This will replace your current tier list with the imported one. Continue?')) {
      // Restore settings if available
      if (metadata.characterFilter) {
        const filterSelect = document.querySelector('select') as HTMLSelectElement;
        if (filterSelect) {
          // Get valid filter options from the select element
          const validFilters = Array.from(filterSelect.options).map(option => option.value);
          if (validFilters.includes(metadata.characterFilter)) {
            this.characterFilter = metadata.characterFilter;
            filterSelect.value = this.characterFilter;
          } else {
            this.characterFilter = 'all';
            filterSelect.value = 'all';
          }
        } else {
          this.characterFilter = metadata.characterFilter;
        }
      }
      if (metadata.splitTwins !== undefined) {
        this.splitTwins = metadata.splitTwins;
        // Trigger the twins splitting/combining logic
        // Update the checkbox state in the UI
        const splitTwinsCheckbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (splitTwinsCheckbox) {
          splitTwinsCheckbox.checked = this.splitTwins;
        }
        // Trigger the twins splitting/combining logic
        this.onSplitTwinsChange({ target: { checked: this.splitTwins } });
      }

      // Clear current tiers
      this.tiers.forEach(tier => tier.characters = []);
      
      // Restore tiers from metadata
      metadata.tiers.forEach((tierMeta: any, index: number) => {
        if (index < this.tiers.length) {
          this.tiers[index].name = tierMeta.name;
          this.tiers[index].color = tierMeta.color;
          
          // Find characters by ID or name and add them to the tier
          if (tierMeta.characters) {
            this.findAndAddCharactersToTier(index, tierMeta.characters);
          }
        } else {
          // Add new tier if more tiers in import than current
          this.tiers.push({
            name: tierMeta.name,
            color: tierMeta.color,
            characters: []
          });
          const newTierIndex = this.tiers.length - 1;
          
          if (tierMeta.characters) {
            this.findAndAddCharactersToTier(newTierIndex, tierMeta.characters);
          }
        }
      });

      alert('Tier list imported successfully!');
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

  saveMetadataJSON() {
    const metadata = {
      exportDate: new Date().toISOString(),
      characterFilter: this.characterFilter,
      splitTwins: this.splitTwins,
      tiers: this.tiers.map(tier => ({
        name: tier.name,
        color: tier.color,
        characters: tier.characters.map(char => ({
          id: (char as any).id,
          name: char.name
        }))
      }))
    };

    const jsonString = JSON.stringify(metadata, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `tier-list-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }
}
