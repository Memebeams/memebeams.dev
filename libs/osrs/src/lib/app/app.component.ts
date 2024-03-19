import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { OSRSButton, OSRSButtonsComponent } from '../buttons/buttons.component';
import { OSRSTooltipComponent } from '../tooltip/tooltip.component';
import { OSRSTooltipService } from '../tooltip/tooltip.service';

@Component({
  selector: 'rs-app',
  standalone: true,
  imports: [CommonModule, OSRSButtonsComponent, OSRSTooltipComponent],
  providers: [OSRSTooltipService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class OSRSAppComponent {
  @Input() buttons: OSRSButton[] = [];
}
