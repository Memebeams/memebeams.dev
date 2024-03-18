import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ClanBannerComponent } from '@memebeams-dev/clan';
import {
  OSRSAppComponent,
  OSRSPanelComponent,
  OSRSTextComponent,
  OSRSTooltipComponent,
} from '@memebeams-dev/osrs';
import { OSRSTooltipService } from 'libs/osrs/src/lib/tooltip/tooltip.service';

@Component({
  standalone: true,
  imports: [
    OSRSAppComponent,
    OSRSTextComponent,
    OSRSPanelComponent,
    ClanBannerComponent,
    RouterModule,
    OSRSTooltipComponent,
  ],
  providers: [OSRSTooltipService],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'memebeams-dev';
}
