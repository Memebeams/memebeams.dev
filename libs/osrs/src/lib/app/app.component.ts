import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { OSRSButtonsComponent } from '../buttons/buttons.component';

@Component({
  selector: 'rs-app',
  standalone: true,
  imports: [CommonModule, OSRSButtonsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class OSRSAppComponent {}
