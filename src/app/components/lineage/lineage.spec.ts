import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lineage } from './lineage';

describe('Lineage', () => {
  let component: Lineage;
  let fixture: ComponentFixture<Lineage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lineage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Lineage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
