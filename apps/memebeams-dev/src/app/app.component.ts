import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ClanBannerComponent } from '@memebeams-dev/clan';
import {
  OSRSAppComponent,
  OSRSPanelComponent,
  OSRSTextComponent,
} from '@memebeams-dev/osrs';

@Component({
  standalone: true,
  imports: [
    OSRSAppComponent,
    OSRSTextComponent,
    OSRSPanelComponent,
    ClanBannerComponent,
    RouterModule,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
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
  ];
}
