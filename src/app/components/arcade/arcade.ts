import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Character, CharacterService } from '../../services/character.service';
import { iconAssetPath } from '../../utils/character-assets';
import { EditStats } from './edit-stats/edit-stats';
import { Matchup } from './matchup/matchup';

@Component({
  selector: 'app-arcade', imports: [CommonModule, FormsModule, Matchup, EditStats, RouterLink],
  templateUrl: './arcade.html', styleUrl: './arcade.scss'
})
export class Arcade implements OnInit, OnDestroy {
  private roster = inject(CharacterService);
  private subscriptions = new Subscription();
  characters: Character[] = [];
  loading = true;
  error = '';
  playerId = 999;
  developerName = 'The Developer';
  selectionSeat = 0;
  hoveredId: number | null = null;
  search = '';
  opponentId = -1;
  editingStats = false;
  matchup: { player: Character; opponent: Character } | null = null;
  portrait(path: string) { return iconAssetPath(path || 'extended/Unknown.png'); }
  useUnknownIcon(event: Event) {
    const image = event.currentTarget as HTMLImageElement;
    const fallback = this.portrait('extended/Unknown.png');
    if (image.getAttribute('src') !== fallback) image.setAttribute('src', fallback);
  }

  renameDeveloper(value: string) {
    this.developerName = value;
    const name = value.trim() || 'The Developer';
    this.characters = this.characters.map(character => character.id === 999
      ? { ...character, name, shortName: name } : character);
    try { localStorage.setItem('arcade-developer-name', name); } catch { /* Session-only if storage is unavailable. */ }
  }

  ngOnInit() {
    try { this.developerName = localStorage.getItem('arcade-developer-name')?.trim() || 'The Developer'; } catch { }

    this.subscriptions.add(this.roster.getCharactersSplitTwins().subscribe({
      next: chars => {
        this.characters = chars.filter(c => c.id !== 0 && c.mature !== 0).map(c => c.id === 999 ? { ...c, name: this.developerName, shortName: this.developerName } : c).sort((a, b) => a.id - b.id);
        this.playerId = this.characters.find(c => c.id === 999)?.id ?? this.characters[0]?.id ?? 999;
        this.loading = false;
      }, error: () => { this.loading = false; this.error = 'Could not load the roster. Reload to try again.'; }
    }));
  }
  ngOnDestroy() { this.subscriptions.unsubscribe(); }
  get seats() { return [this.playerId, this.opponentId]; }
  get visibleCharacters() { const query = this.search.trim().toLowerCase(); return this.characters.filter(c => `${c.name} ${c.shortName}`.toLowerCase().includes(query)); }
  get preview() { return this.characterFor(this.hoveredId ?? this.seats[this.selectionSeat]); }
  characterFor(id: number) { return this.characters.find(c => c.id === id); }
  seatLabel(seat: number) { return seat === 0 ? 'P1 · YOU' : `CPU ${seat}`; }
  selectSeat(seat: number) { this.selectionSeat = seat; this.hoveredId = null; }
  choose(id: number) {
    if (!this.characterFor(id) && !(id === -1 && this.selectionSeat === 1)) return;
    if (this.selectionSeat === 0) this.playerId = id;
    else this.opponentId = id;
    this.hoveredId = null; this.error = '';
  }
  fight() {
    const player = this.characterFor(this.playerId);
    const opponent = this.opponentId === -1
      ? this.characters[Math.floor(Math.random() * this.characters.length)]
      : this.characterFor(this.opponentId);
    if (!player || !opponent) {
      this.error = 'Choose a character for each seat.';
      return;
    }
    this.error = '';
    this.matchup = { player, opponent };
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
}
