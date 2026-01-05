import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Duos2 } from './duos-2';

describe('Duos2', () => {
  let component: Duos2;
  let fixture: ComponentFixture<Duos2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Duos2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Duos2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
