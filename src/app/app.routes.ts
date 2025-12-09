import { Routes } from '@angular/router';
import { TierList } from './components/tier-list/tier-list';
import { Roster } from './components/roster/roster';
import { SpinTheWheel } from './components/spin-the-wheel/spin-the-wheel';
import { Duos } from './components/duos/duos';
import { Trios } from './components/trios/trios';
import { BirthdayCalendar } from './components/birthday-calendar/birthday-calendar';
import { Tournament } from './components/tournament/tournament';
import { BlindRanking } from './components/blind-ranking/blind-ranking';
import { StoryHelper } from './components/story-helper/story-helper';

export const routes: Routes = [
  { path: '', component: Roster, title: 'Choose Your Character!' },
  { path: 'blind-ranking', component: BlindRanking, title: 'Blind Ranking' },
  { path: 'tier-list', component: TierList, title: 'Create a Tier List' },
  { path: 'spin-the-wheel', component: SpinTheWheel, title: 'Spin the Wheel' },
  { path: 'duos', component: Duos, title: 'Duo Name Generator' },
  { path: 'trios', component: Trios, title: 'Hall of Trios' },
  { path: 'birthday-calendar', component: BirthdayCalendar, title: 'Birthday Calendar' },
  { path: 'tournament', component: Tournament, title: 'Tournament Bracket' },
  { path: 'story-helper', component: StoryHelper, title: 'Story Helper' }
];
