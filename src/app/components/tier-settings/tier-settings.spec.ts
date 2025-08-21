import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TierSettings } from './tier-settings';

describe('TierSettings', () => {
  let component: TierSettings;
  let fixture: ComponentFixture<TierSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TierSettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TierSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
