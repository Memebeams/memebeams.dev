import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'clan',
    children: [
      {
        path: 'discord',
        loadComponent: () =>
          import('@memebeams-dev/clan').then((m) => m.ClanDiscordComponent),
      },
      {
        path: 'bounty',
        loadComponent: () =>
          import('@memebeams-dev/clan').then((m) => m.ClanBountyComponent),
      },
      {
        path: 'sotw-botw',
        loadComponent: () =>
          import('@memebeams-dev/clan').then((m) => m.ClanSotwComponent),
      },
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('@memebeams-dev/clan').then((m) => m.ClanHomeComponent),
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'clan',
  },
];
