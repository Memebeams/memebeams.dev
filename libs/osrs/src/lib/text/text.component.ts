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
  @Input() tag: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = 'p';

  @ViewChild('text', { read: ElementRef, static: true }) text:
    | ElementRef
    | undefined;
}
