import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Duos } from './duos';

describe('Duos', () => {
  let component: Duos;
  let fixture: ComponentFixture<Duos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Duos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Duos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
