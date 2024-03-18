import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { OSRSPanelComponent, OSRSTextComponent } from '@memebeams-dev/osrs';

@Component({
  selector: 'clan-discord',
  standalone: true,
  imports: [CommonModule, OSRSPanelComponent, OSRSTextComponent],
  templateUrl: './discord.component.html',
  styleUrl: './discord.component.scss',
})
export class ClanDiscordComponent {}
