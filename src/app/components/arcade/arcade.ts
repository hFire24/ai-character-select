import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription, timeout } from 'rxjs';
import { Character, CharacterService } from '../../services/character.service';
import { iconAssetPath } from '../../utils/character-assets';
import { bestSelection, scoreDice } from './farkle';
import { characterReaction, ReactionEvent } from './reactions';

interface Player { name: string; character: Character; score: number; scoreOrder: number }
interface Line { name: string; text: string; ai: boolean }

@Component({
  selector: 'app-arcade', imports: [CommonModule, FormsModule],
  templateUrl: './arcade.html', styleUrl: './arcade.scss'
})
export class Arcade implements OnInit, OnDestroy {
  private roster = inject(CharacterService);
  private http = inject(HttpClient);
  private subscriptions = new Subscription();
  private timer?: ReturnType<typeof setTimeout>;
  private session = 0;
  private bankOrder = 0;
  characters: Character[] = [];
  loading = true;
  error = '';
  playerId = 999;
  selectionSeat = 0;
  hoveredId: number | null = null;
  search = '';
  opponentIds = [-1, -1];
  target = 5000;
  players: Player[] = [];
  active = 0;
  playing = false;
  winner: Player | null = null;
  dice: number[] = [];
  selected: number[] = [];
  remaining = 6;
  turnPoints = 0;
  message = '';
  history: Line[] = [];
  finalTurns: number | null = null;
  dialogue = true;
  dialogueStatus = 'Preparing character reactions…';
  private aiAvailable = false;
  readonly faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  portrait(path: string) { return iconAssetPath(path || 'extended/Unknown.png'); }
  useUnknownIcon(event: Event) {
    const image = event.currentTarget as HTMLImageElement;
    const fallback = this.portrait('extended/Unknown.png');
    if (image.getAttribute('src') !== fallback) image.setAttribute('src', fallback);
  }

  ngOnInit() {
    this.subscriptions.add(this.roster.getCharactersSplitTwins().subscribe({
      next: chars => {
        this.characters = chars.filter(c => c.id !== 0 && c.mature !== 0).sort((a, b) => a.id - b.id);
        this.playerId = this.characters.find(c => c.status === 'me' || c.name === 'Me')?.id ?? this.characters[0]?.id ?? 999;
        this.loading = false;
      }, error: () => { this.loading = false; this.error = 'Could not load the roster. Reload to try again.'; }
    }));
    this.subscriptions.add(this.http.get<{ available: boolean }>('/api/arcade/status').pipe(timeout(3000)).subscribe({
      next: r => { this.aiAvailable = r.available; this.dialogueStatus = r.available ? 'AI character dialogue ready' : 'Built-in character reactions'; },
      error: () => { this.dialogueStatus = 'Built-in character reactions'; }
    }));
  }
  ngOnDestroy() { this.session++; clearTimeout(this.timer); this.subscriptions.unsubscribe(); }
  get current() { return this.players[this.active]; }
  get humanTurn() { return this.playing && this.active === 0 && !this.winner; }
  get selectionScore() { return scoreDice(this.selected.map(i => this.dice[i])); }
  get canBank() { return this.turnPoints + this.selectionScore > 0 && (!this.selected.length || this.selectionScore > 0); }
  get seats() { return [this.playerId, ...this.opponentIds]; }
  get visibleCharacters() { const query = this.search.trim().toLowerCase(); return this.characters.filter(c => `${c.name} ${c.shortName}`.toLowerCase().includes(query)); }
  get preview() { return this.characterFor(this.hoveredId ?? this.seats[this.selectionSeat]); }
  characterFor(id: number) { return this.characters.find(c => c.id === id); }
  seatLabel(seat: number) { return seat === 0 ? 'P1 · YOU' : `CPU ${seat}`; }
  taken(id: number) { return this.seats.some((chosen, seat) => chosen === id && seat !== this.selectionSeat); }
  selectSeat(seat: number) { this.selectionSeat = seat; this.hoveredId = null; }
  choose(id: number) {
    if ((id === -1 && this.selectionSeat === 0) || this.taken(id) && id !== -1) return;
    if (this.selectionSeat === 0) this.playerId = id;
    else this.opponentIds[this.selectionSeat - 1] = id;
    this.hoveredId = null; this.error = '';
  }
  setOpponentCount(count: number) {
    this.opponentIds = Array.from({ length: count }, (_, i) => this.opponentIds[i] ?? -1);
    if (this.selectionSeat > count) this.selectSeat(0);
  }
  private isMe(player: Player) { return player === this.players[0] && (player.character.status === 'me' || player.character.name === 'Me'); }

  start() {
    clearTimeout(this.timer);
    this.session++;
    this.error = '';
    if (!this.characterFor(this.playerId) || this.opponentIds.some(id => id !== -1 && !this.characterFor(id))) {
      this.error = 'Select a roster character for each seat.'; return;
    }
    const chosen = [this.playerId, ...this.opponentIds].filter(id => id > 0);
    if (new Set(chosen).size !== chosen.length) { this.error = 'Choose a different character for each seat.'; return; }
    const pool = this.characters.filter(c => !chosen.includes(c.id));
    if (pool.length < this.opponentIds.filter(id => id === -1).length) { this.error = 'Not enough characters for random opponents.'; return; }
    const resolve = (id: number): Player => {
      const character = id === -1
        ? pool.splice(Math.floor(Math.random() * pool.length), 1)[0]
        : this.characters.find(c => c.id === id)!;
      return { character, name: character.shortName || character.name, score: 0, scoreOrder: 0 };
    };
    this.players = [resolve(this.playerId), ...this.opponentIds.map(resolve)];
    this.active = 0; this.winner = null; this.finalTurns = null; this.history = []; this.playing = true; this.bankOrder = 0;
    this.resetTurn(); this.message = 'Your turn! Roll six dice to begin.';
  }
  lobby() { this.session++; clearTimeout(this.timer); this.playing = false; }
  toggle(i: number) {
    if (!this.humanTurn) return;
    this.selected = this.selected.includes(i) ? this.selected.filter(n => n !== i) : [...this.selected, i];
  }
  private keep(): boolean {
    if (!this.selectionScore) return false;
    this.turnPoints += this.selectionScore;
    this.remaining -= this.selected.length;
    if (!this.remaining) { this.remaining = 6; this.message = 'Hot dice! All six dice are available again.'; }
    this.dice = []; this.selected = [];
    return true;
  }
  roll() {
    if (!this.playing || this.winner) return;
    if (this.dice.length && !this.keep()) { this.message = 'Select scoring dice before rolling again.'; return; }
    this.dice = Array.from({ length: this.remaining }, () => Math.floor(Math.random() * 6) + 1);
    this.selected = [];
    if (!bestSelection(this.dice).score) {
      this.message = `${this.isMe(this.current) ? 'You' : this.current.name} farkled! ${this.turnPoints} turn points lost.`;
      this.react(this.current, this.message, 'farkle', this.turnPoints);
      this.endTurn();
    } else this.message = this.humanTurn ? 'Choose scoring dice, then bank or roll again.' : `${this.current.name} is considering the dice…`;
  }
  bank() {
    if (!this.playing || this.winner || !this.canBank) return;
    if (this.selected.length) this.keep();
    const points = this.turnPoints;
    this.current.score += points;
    this.current.scoreOrder = ++this.bankOrder;
    this.message = `${this.isMe(this.current) ? 'You' : this.current.name} banked ${points} points.`;
    this.react(this.current, this.message, 'bank', points);
    if (this.finalTurns === null && this.current.score >= this.target) {
      this.finalTurns = this.players.length;
      this.message += ' Final round: everyone else gets one last turn!';
    }
    this.endTurn();
  }
  private resetTurn() { this.dice = []; this.selected = []; this.remaining = 6; this.turnPoints = 0; }
  private endTurn() {
    if (this.finalTurns !== null && --this.finalTurns === 0) {
      // Ties favor the player who reached the winning score first.
      this.winner = this.players.reduce((best, p) => p.score > best.score || (p.score === best.score && p.scoreOrder < best.scoreOrder) ? p : best, this.current);
      this.message = this.isMe(this.winner) ? `You win with ${this.winner.score} points!` : `${this.winner.name} wins with ${this.winner.score} points!`;
      this.react(this.winner, this.message, 'win', this.winner.score);
      return;
    }
    this.active = (this.active + 1) % this.players.length;
    this.resetTurn(); this.scheduleBot();
  }
  private scheduleBot() {
    if (this.active === 0 || this.winner) return;
    this.timer = setTimeout(() => this.botStep(), 1100);
  }
  private botStep() {
    if (!this.playing || this.winner || this.active === 0) return;
    if (!this.dice.length) { this.roll(); if (this.dice.length) this.scheduleBot(); return; }
    this.selected = bestSelection(this.dice).indices;
    const threshold = this.current.character?.straightforward ? 350 : 600;
    if (this.turnPoints + this.selectionScore >= threshold || this.current.score + this.turnPoints + this.selectionScore >= this.target) this.bank();
    else { this.roll(); if (this.dice.length) this.scheduleBot(); }
  }
  private react(player: Player, event: string, kind: ReactionEvent, points: number) {
    if (this.isMe(player) || !this.dialogue) {
      this.history = [{ name: 'Game', text: event, ai: false }, ...this.history].slice(0, 30);
      if (!this.dialogue) return;
    }
    const speaker = this.isMe(player) ? this.players.find(p => !this.isMe(p)) : player;
    if (!speaker) return;
    if (!speaker.character) return;
    const ownTurn = speaker === player;
    const character = speaker.character;
    const fallback = characterReaction(character, kind, points, player.character ? player.name : 'you', ownTurn,
      this.history.filter(line => line.name === speaker.name).slice(0, 5).map(line => line.text));
    const line: Line = { name: speaker.name, text: fallback, ai: false };
    this.history = [line, ...this.history].slice(0, 30);
    if (!this.aiAvailable) return;
    const session = this.session;
    this.subscriptions.add(this.http.post<{ text: string }>('/api/arcade/dialogue', {
      characterId: character.id, event: ownTurn ? event : `${event} React as an opponent watching this event, not as the player who took the turn.`,
      scores: this.players.map(p => `${p.name}: ${p.score}`).join(', ')
    }).pipe(timeout(8000)).subscribe({
      next: r => { if (session === this.session && r.text) { line.text = r.text; line.ai = true; } },
      error: () => { if (session === this.session) { this.aiAvailable = false; this.dialogueStatus = 'Built-in character reactions'; } }
    }));
  }
}
