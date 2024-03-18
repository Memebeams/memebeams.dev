import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OSRSButtonsComponent } from './buttons.component';

describe('OSRSButtonsComponent', () => {
  let component: OSRSButtonsComponent;
  let fixture: ComponentFixture<OSRSButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OSRSButtonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OSRSButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
