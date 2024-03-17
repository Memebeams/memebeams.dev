import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OSRSTextComponent } from './text.component';

describe('TextComponent', () => {
  let component: OSRSTextComponent;
  let fixture: ComponentFixture<OSRSTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OSRSTextComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OSRSTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
