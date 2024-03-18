import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OSRSTooltipComponent } from './tooltip.component';

describe('TooltipComponent', () => {
  let component: OSRSTooltipComponent;
  let fixture: ComponentFixture<OSRSTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OSRSTooltipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OSRSTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
