import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'rs-text',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text.component.html',
  styleUrl: './text.component.scss',
})
export class OSRSTextComponent {
  @Input() font: 'standard' | 'fancy' = 'standard';
  @Input() color: string = 'white';

  @ViewChild('text', { read: ElementRef, static: true }) text:
    | ElementRef
    | undefined;
}
