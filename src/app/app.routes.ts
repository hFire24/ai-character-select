import { Routes } from '@angular/router';
import { Roster } from './components/roster/roster';

export const routes: Routes = [
  { path: '', component: Roster, title: 'Choose Your Character!' },
  { path: 'blind-ranking', loadComponent: () => import('./components/blind-ranking/blind-ranking').then(m => m.BlindRanking), title: 'Blind Ranking' },
  { path: 'tier-list', loadComponent: () => import('./components/tier-list/tier-list').then(m => m.TierList), title: 'Create a Tier List' },
  { path: 'spin-the-wheel', loadComponent: () => import('./components/spin-the-wheel/spin-the-wheel').then(m => m.SpinTheWheel), title: 'Spin the Wheel' },
  { path: 'duos', loadComponent: () => import('./components/duos/duos').then(m => m.Duos), title: 'Duo Name Generator' },
  { path: 'duos-2', loadComponent: () => import('./components/duos-2/duos-2').then(m => m.Duos2), title: 'View Duos' },
  { path: 'trios', loadComponent: () => import('./components/trios/trios').then(m => m.Trios), title: 'Hall of Trios' },
  { path: 'birthday-calendar', loadComponent: () => import('./components/birthday-calendar/birthday-calendar').then(m => m.BirthdayCalendar), title: 'Birthday Calendar' },
  { path: 'timeline', loadComponent: () => import('./components/timeline/timeline').then(m => m.Timeline), title: 'Character Timeline' },
  { path: 'tournament', loadComponent: () => import('./components/tournament/tournament').then(m => m.Tournament), title: 'Tournament Bracket' },
  { path: 'story-helper', loadComponent: () => import('./components/story-helper/story-helper').then(m => m.StoryHelper), title: 'Story Helper' },
  { path: 'sorter', loadComponent: () => import('./components/sorter/sorter').then(m => m.Sorter), title: 'Character Sorter' },
  { path: 'stats', loadComponent: () => import('./components/stats/stats').then(m => m.Stats), title: 'Character Statistics' },
  { path: 'hangouts', loadComponent: () => import('./components/hangouts/hangouts').then(m => m.Hangouts), title: 'Random Hangouts' },
  { path: 'groups', loadComponent: () => import('./components/groups/groups').then(m => m.Groups), title: 'Hall of Groups' },
  { path: 'chat-manager', loadComponent: () => import('./components/chat-manager/chat-manager').then(m => m.ChatManager), title: 'Manage Active Chats' },
  { path: 'lineage', loadComponent: () => import('./components/lineage/lineage').then(m => m.Lineage), title: 'Lineage' },
  { path: 'id-checker', loadComponent: () => import('./components/id-checker/id-checker').then(m => m.IdChecker), title: 'ID Checker' },
  { path: 'announcement', loadComponent: () => import('./components/announcement/announcement').then(m => m.Announcement), title: 'Announcement' },
  { path: 'manage-tiers', loadComponent: () => import('./components/manage-tiers/manage-tiers').then(m => m.ManageTiers), title: 'Manage Tiers' },
  { path: 'chat-history-chart', loadComponent: () => import('./components/chat-history-chart/chat-history-chart').then(m => m.ChatHistoryChart), title: 'Chat History Spread' }
];
