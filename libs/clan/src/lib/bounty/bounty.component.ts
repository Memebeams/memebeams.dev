import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { OSRSPanelComponent, OSRSTextComponent } from '@memebeams-dev/osrs';

@Component({
  selector: 'clan-bounty',
  standalone: true,
  imports: [CommonModule, OSRSPanelComponent, OSRSTextComponent],
  templateUrl: './bounty.component.html',
  styleUrl: './bounty.component.scss',
})
export class ClanBountyComponent {}
