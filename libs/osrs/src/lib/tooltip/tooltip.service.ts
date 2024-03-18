import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OSRSTooltipService {
  private readonly _tooltip$ = new BehaviorSubject<string>('');
  readonly tooltip$ = this._tooltip$.asObservable();

  setTooltip(tooltip: string): void {
    this._tooltip$.next(tooltip);
  }
}
