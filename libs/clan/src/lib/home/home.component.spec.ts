import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClanHomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: ClanHomeComponent;
  let fixture: ComponentFixture<ClanHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClanHomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClanHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
