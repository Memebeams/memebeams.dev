import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClanSotwComponent } from './sotw.component';

describe('SotwComponent', () => {
  let component: ClanSotwComponent;
  let fixture: ComponentFixture<ClanSotwComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClanSotwComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClanSotwComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
