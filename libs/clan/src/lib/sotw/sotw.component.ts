import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { OSRSPanelComponent, OSRSTextComponent } from '@memebeams-dev/osrs';

@Component({
  selector: 'clan-sotw',
  standalone: true,
  imports: [CommonModule, OSRSPanelComponent, OSRSTextComponent],
  templateUrl: './sotw.component.html',
  styleUrl: './sotw.component.scss',
})
export class ClanSotwComponent {}
