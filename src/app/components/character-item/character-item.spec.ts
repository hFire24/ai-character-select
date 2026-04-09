import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterItem } from './character-item';

describe('CharacterItem', () => {
  let component: CharacterItem;
  let fixture: ComponentFixture<CharacterItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
