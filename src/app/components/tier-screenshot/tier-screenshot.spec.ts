import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TierScreenshot } from './tier-screenshot';

describe('TierScreenshot', () => {
  let component: TierScreenshot;
  let fixture: ComponentFixture<TierScreenshot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TierScreenshot]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TierScreenshot);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
