import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClanBannerComponent } from './banner.component';

describe('ClanBannerComponent', () => {
  let component: ClanBannerComponent;
  let fixture: ComponentFixture<ClanBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClanBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClanBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
