import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderButtons } from './header-buttons';

describe('HeaderButtons', () => {
  let component: HeaderButtons;
  let fixture: ComponentFixture<HeaderButtons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderButtons]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderButtons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
