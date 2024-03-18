import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'discord',
    loadComponent: () =>
      import('@memebeams-dev/clan').then((m) => m.ClanDiscordComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('@memebeams-dev/clan').then((m) => m.ClanHomeComponent),
  },
];
