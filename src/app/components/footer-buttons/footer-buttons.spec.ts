import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterButtons } from './footer-buttons';

describe('FooterButtons', () => {
  let component: FooterButtons;
  let fixture: ComponentFixture<FooterButtons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterButtons]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterButtons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
