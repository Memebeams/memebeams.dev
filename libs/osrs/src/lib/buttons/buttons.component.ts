import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { RxFor } from '@rx-angular/template/for';
import { RxLet } from '@rx-angular/template/let';
import { filter, map, tap } from 'rxjs';
import { OSRSTooltipDirective } from '../tooltip/tooltip.directive';

export interface OSRSButton {
  icon: string;
  alt: string;
  path: string;
}

@Component({
  selector: 'rs-buttons',
  standalone: true,
  imports: [CommonModule, OSRSTooltipDirective, RouterModule, RxLet, RxFor],
  templateUrl: './buttons.component.html',
  styleUrl: './buttons.component.scss',
})
export class OSRSButtonsComponent {
  private readonly router = inject(Router);
  private readonly buttons = [
    {
      icon: 'discord',
      alt: 'Discord',
      path: '/discord',
    },
    {
      icon: 'cell',
      alt: 'Home',
      path: '/',
    },
    {
      icon: 'bounty',
      alt: 'Bounty',
      path: 'bounty',
    },
  ];

  buttons$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.url),
    tap(console.log),
    map((path) =>
      this.buttons.map((button) => ({
        ...button,
        src: this.getSrc(button, path),
      }))
    )
  );

  private getSrc(button: OSRSButton, path: string) {
    const name =
      button.path === path ?? '' ? `${button.icon}_selected` : button.icon;
    return `assets/buttons/${name}.png`;
  }
}
