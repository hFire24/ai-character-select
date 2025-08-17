import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterModal } from './character-modal';

describe('CharacterModal', () => {
  let component: CharacterModal;
  let fixture: ComponentFixture<CharacterModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
