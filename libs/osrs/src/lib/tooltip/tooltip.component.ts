import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RxLet } from '@rx-angular/template/let';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { OSRSTextComponent } from '../text/text.component';
import { OSRSTooltipService } from './tooltip.service';

@Component({
  selector: 'rs-tooltip',
  standalone: true,
  imports: [CommonModule, OSRSTextComponent, RxLet],
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.scss',
})
export class OSRSTooltipComponent {
  readonly service = inject(OSRSTooltipService);

  private readonly _position$ = new BehaviorSubject<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  readonly viewModel$ = combineLatest([
    this._position$,
    this.service.tooltip$,
  ]).pipe(map(([position, tooltip]) => ({ position, tooltip })));

  constructor() {
    document.body.addEventListener('mousemove', (event) => {
      this._position$.next({ x: event.pageX, y: event.pageY });
    });
  }
}
