import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TournamentBracket } from '../tournament-bracket/tournament-bracket';
import { BackButton } from '../back-button/back-button';

@Component({
  selector: 'app-tournament',
  imports: [FormsModule, CommonModule, TournamentBracket, BackButton],
  templateUrl: './tournament.html',
  styleUrl: './tournament.scss'
})
export class Tournament {
  numPlayers: number = 8;
  tournamentCreated: boolean = false;
  tournamentName: string = 'Tournament';

  createBracket() {
    this.tournamentCreated = true;
  }
}
