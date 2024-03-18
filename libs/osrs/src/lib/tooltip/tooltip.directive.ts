import { Directive, HostListener, Input, inject } from '@angular/core';
import { OSRSTooltipService } from './tooltip.service';

@Directive({
  selector: '[rsTooltip]',
  standalone: true,
})
export class OSRSTooltipDirective {
  private readonly service = inject(OSRSTooltipService);

  @Input('rsTooltip') rsTooltip = '';

  @HostListener('mouseenter') onMouseEnter(): void {
    this.service.setTooltip(this.rsTooltip);
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    this.service.setTooltip('');
  }
}
