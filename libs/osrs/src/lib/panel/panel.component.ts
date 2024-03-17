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
  @Input() @HostBinding('class.wide') wide = false;
}
