import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterGrid } from './character-grid';

describe('CharacterGrid', () => {
  let component: CharacterGrid;
  let fixture: ComponentFixture<CharacterGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
