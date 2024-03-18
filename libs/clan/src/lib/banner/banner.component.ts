import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { OSRSTextComponent } from '@memebeams-dev/osrs';

@Component({
  selector: 'clan-banner',
  standalone: true,
  imports: [CommonModule, OSRSTextComponent],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
})
export class ClanBannerComponent {}
