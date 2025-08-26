import { Routes } from '@angular/router';
import { TierList } from './components/tier-list/tier-list';
import { Roster } from './components/roster/roster';
import { SpinTheWheel } from './components/spin-the-wheel/spin-the-wheel';

export const routes: Routes = [
  { path: '', component: Roster, title: 'Choose Your Character!' },
  { path: 'tier-list', component: TierList, title: 'Create a Tier List' },
  { path: 'spin-the-wheel', component: SpinTheWheel, title: 'Spin the Wheel' }
];
