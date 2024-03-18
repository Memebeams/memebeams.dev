import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClanDiscordComponent } from './discord.component';

describe('DiscordComponent', () => {
  let component: ClanDiscordComponent;
  let fixture: ComponentFixture<ClanDiscordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClanDiscordComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClanDiscordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
