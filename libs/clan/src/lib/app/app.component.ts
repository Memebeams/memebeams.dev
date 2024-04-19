import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OSRSAppComponent } from '@memebeams-dev/osrs';

@Component({
  selector: 'clan-app',
  standalone: true,
  imports: [RouterOutlet, OSRSAppComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClanAppComponent {
  readonly buttons = [
    {
      icon: 'discord',
      alt: 'Discord',
      path: '/clan/discord',
    },
    {
      icon: 'cell',
      alt: 'Home',
      path: '/clan',
    },
    {
      icon: 'bounty',
      alt: 'Bounty',
      path: '/clan/bounty',
    },
    {
      icon: 'sotw',
      alt: 'Competitions',
      path: '/clan/sotw-botw',
    },
  ];
}
