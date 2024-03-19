import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { RxFor } from '@rx-angular/template/for';
import { RxLet } from '@rx-angular/template/let';
import { BehaviorSubject, combineLatest, filter, map } from 'rxjs';
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

  private readonly _buttons$ = new BehaviorSubject<OSRSButton[]>([]);
  @Input() set buttons(buttons: OSRSButton[]) {
    this._buttons$.next(buttons);
  }

  buttons$ = combineLatest([
    this._buttons$,
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ),
  ]).pipe(
    map(([buttons, path]) =>
      buttons.map((button) => ({
        ...button,
        src: this.getSrc(button, path.urlAfterRedirects),
      }))
    )
  );

  private getSrc(button: OSRSButton, path: string) {
    const name =
      button.path === path ?? '' ? `${button.icon}_selected` : button.icon;
    return `assets/buttons/${name}.png`;
  }
}
