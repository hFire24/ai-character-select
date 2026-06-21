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

  it('uses the same default character-type filters as the sorter', () => {
    expect(component.filterOptions.status).toEqual({
      active: true,
      inactive: true,
      side: true,
      retired: true,
      me: false,
      bonus: true
    });
  });

  it('applies the girls gender filter', () => {
    component.genderFilter = 'girls';

    expect(component.filterOptions.attributes?.pronouns).toEqual(['she/her']);
  });
});
