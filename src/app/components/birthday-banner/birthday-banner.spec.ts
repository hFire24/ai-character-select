import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BirthdayBanner } from './birthday-banner';

describe('BirthdayBanner', () => {
  let component: BirthdayBanner;
  let fixture: ComponentFixture<BirthdayBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
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
