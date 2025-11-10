import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Trios } from './trios';

describe('Trios', () => {
  let component: Trios;
  let fixture: ComponentFixture<Trios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Trios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
