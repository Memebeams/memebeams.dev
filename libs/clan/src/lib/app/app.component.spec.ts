import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClanAppComponent } from './app.component';

describe('AppComponent', () => {
  let component: ClanAppComponent;
  let fixture: ComponentFixture<ClanAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClanAppComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClanAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
