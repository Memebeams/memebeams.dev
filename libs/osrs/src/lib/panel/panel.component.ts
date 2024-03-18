import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { OSRSTextComponent } from '../text/text.component';

@Component({
  selector: 'rs-panel',
  standalone: true,
  imports: [CommonModule, OSRSTextComponent],
  templateUrl: './panel.component.html',
  styleUrl: './panel.component.scss',
})
export class OSRSPanelComponent {
  @HostBinding('class.wide') wide = false;
  @HostBinding('class.full') full = false;
  @Input() set width(value: 'narrow' | 'wide' | 'full') {
    this.wide = value === 'wide';
    this.full = value === 'full';
  }
}
