import { Component, computed, input, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Character } from '../../../services/character.service';
import { CharacterCombatConfig, loadCombatConfig, saveCombatConfig, specialEffects, SpecialEffect, CharacterStats } from '../matchup/matchup';

@Component({
  selector: 'app-edit-stats',
  imports: [FormsModule],
  templateUrl: './edit-stats.html',
  styleUrl: './edit-stats.scss'
})
export class EditStats implements OnInit {
  readonly characters = input.required<Character[]>();
  readonly sortedAllies = computed(() => [...this.characters()].sort((a, b) =>
    (a.shortName || a.name).localeCompare(b.shortName || b.name, undefined, { sensitivity: 'base', numeric: true })
  ));
  readonly initialId = input.required<number>();
  readonly close = output<void>();
  characterId = 0;
  draft!: CharacterCombatConfig;
  error = '';
  message = '';
  dirty = false;
  readonly resourceKeys = ['hp', 'mp'] as const;
  readonly hiddenKeys = ['attack', 'defense', 'accuracy', 'evade'] as const;
  readonly specialEffects = specialEffects;
  readonly effectGroups = ['Attacking Moves', 'Debuffing Attacks', 'Buffing Moves', 'Healing Moves'].map(label => ({
    label,
    effects: Object.entries(specialEffects).filter(([, info]) => info.group === label)
      .map(([value, info]) => ({ value: value as SpecialEffect, label: info.label }))
  }));
  ngOnInit() { this.load(this.initialId()); }
  load(id: number) {
    this.characterId = id;
    this.draft = structuredClone(loadCombatConfig(id));
    this.draft.stats.mp = 150 - this.draft.stats.hp;
    this.dirty = false;
    this.error = ''; this.message = '';
  }
  get resourceTotal() { return this.draft.stats.hp + this.draft.stats.mp; }
  get hiddenTotal() { return this.hiddenKeys.reduce((sum, key) => sum + this.draft.stats[key], 0); }
  changeStat(key: keyof CharacterStats, value: number) {
    if (key === 'hp' || key === 'mp') {
      const amount = Math.max(40, Math.min(110, Math.round(value / 10) * 10));
      this.draft.stats[key] = amount;
      this.draft.stats[key === 'hp' ? 'mp' : 'hp'] = 150 - amount;
    } else {
      this.draft.stats[key] = Math.max(3, Math.min(7, Math.round(value)));
    }
    this.changed();
  }
  changed() { this.dirty = true; this.message = ''; this.error = ''; }
  typeTaken(type: SpecialEffect, index: number) {
    return this.draft.specials.some((special, i) => i !== index && special.effect === type);
  }
  save() {
    if (this.hiddenTotal > 21) {
      this.error = 'Hidden stats cannot total more than 21. Lower the total before saving.';
      return;
    }
    if (this.hiddenTotal < 21 && !window.confirm(`Your stats total ${this.hiddenTotal}/21. You have ${21 - this.hiddenTotal} unused points. Save and return to the arcade?`)) {
      return;
    }
    try {
      saveCombatConfig(this.characterId, this.draft);
      this.dirty = false;
      this.error = '';
      this.close.emit();
    } catch {
      this.error = 'Could not save. Check stat limits, attack names, and four unique attack types. Browser storage must be available.';
    }
  }
}
