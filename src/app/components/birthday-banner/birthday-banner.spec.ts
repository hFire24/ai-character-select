import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BirthdayBanner } from './birthday-banner';

describe('BirthdayBanner', () => {
  let component: BirthdayBanner;
  let fixture: ComponentFixture<BirthdayBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirthdayBanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BirthdayBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
