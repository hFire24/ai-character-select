import { Routes } from '@angular/router';
import { TierList } from './components/tier-list/tier-list';
import { Roster } from './components/roster/roster';
import { SpinTheWheel } from './components/spin-the-wheel/spin-the-wheel';
import { Trios } from './components/trios/trios';
import { BirthdayCalendar } from './components/birthday-calendar/birthday-calendar';
import { Tournament } from './components/tournament/tournament';

export const routes: Routes = [
  { path: '', component: Roster, title: 'Choose Your Character!' },
  { path: 'tier-list', component: TierList, title: 'Create a Tier List' },
  { path: 'spin-the-wheel', component: SpinTheWheel, title: 'Spin the Wheel' },
  { path: 'trios', component: Trios, title: 'Hall of Trios' },
  { path: 'birthday-calendar', component: BirthdayCalendar, title: 'Birthday Calendar' },
  { path: 'tournament', component: Tournament, title: 'Tournament Bracket' }
];
