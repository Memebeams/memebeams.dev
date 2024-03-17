import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'rs-app',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class OSRSAppComponent {}
