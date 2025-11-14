import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BirthdayCalendar } from './birthday-calendar';

describe('BirthdayCalendar', () => {
  let component: BirthdayCalendar;
  let fixture: ComponentFixture<BirthdayCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirthdayCalendar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BirthdayCalendar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
