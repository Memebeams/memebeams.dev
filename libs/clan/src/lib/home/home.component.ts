import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { OSRSPanelComponent, OSRSTextComponent } from '@memebeams-dev/osrs';
import { ClanBannerComponent } from '../banner/banner.component';

@Component({
  selector: 'clan-home',
  standalone: true,
  imports: [
    CommonModule,
    ClanBannerComponent,
    OSRSPanelComponent,
    OSRSTextComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class ClanHomeComponent {}
