import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlindRanking } from './blind-ranking';

describe('BlindRanking', () => {
  let component: BlindRanking;
  let fixture: ComponentFixture<BlindRanking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlindRanking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlindRanking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
