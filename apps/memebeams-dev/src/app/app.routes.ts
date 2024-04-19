import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'clan',
    loadComponent: () =>
      import('@memebeams-dev/clan').then((m) => m.ClanAppComponent),
    loadChildren: () =>
      import('@memebeams-dev/clan').then((m) => m.ClanAppRoutes),
  },
  {
    path: '**',
    redirectTo: 'clan',
  },
];
