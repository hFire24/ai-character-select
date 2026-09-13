import { SavedSession } from '../../utils/saved-session';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TournamentBracket } from '../tournament-bracket/tournament-bracket';

@Component({
  selector: 'app-tournament',
  imports: [FormsModule, CommonModule, TournamentBracket],
  templateUrl: './tournament.html',
  styleUrl: './tournament.scss'
})
export class Tournament {
  readonly savedSession = new SavedSession('tournament', ["numPlayers","tournamentCreated","tournamentName","seedPreference","includedCharacterIds"]);

  ngDoCheck(): void {
    this.savedSession.save(this);
  }

  numPlayers: number = 64;
  tournamentCreated: boolean = false;
  tournamentName: string = 'Tournament';
  seedPreference: 'high' | 'low' = 'high';
  includedCharacterIds: number[] = [];

  constructor() {
    this.savedSession.initialize(this);
  }

  createBracket() {
    this.tournamentCreated = true;
  }

  restartSession(): void {
    if (!confirm('Restart and discard saved progress?')) return;
    this.savedSession.restart(this);
    SavedSession.clear('tournament-bracket');
  }
}
