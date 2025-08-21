import { Routes } from '@angular/router';
import { TierList } from './components/tier-list/tier-list';
import { Roster } from './components/roster/roster';

export const routes: Routes = [
  { path: '', component: Roster, title: 'Choose Your Character!' },
  { path: 'tier-list', component: TierList, title: 'Create a Tier List' }
];
