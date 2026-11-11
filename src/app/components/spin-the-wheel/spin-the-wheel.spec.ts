import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpinTheWheel } from './spin-the-wheel';

describe('SpinTheWheel', () => {
  let component: SpinTheWheel;
  let fixture: ComponentFixture<SpinTheWheel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      imports: [SpinTheWheel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpinTheWheel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
