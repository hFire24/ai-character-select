import { CharacterModal } from '../character-modal/character-modal';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterItem } from './character-item';

describe('CharacterItem', () => {
  let component: CharacterItem;
  let fixture: ComponentFixture<CharacterItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      imports: [CharacterItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterItem);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('character', {
      ...new CharacterModal({} as any, {} as any).character,
      id: 1, name: 'Test', shortName: 'Test', status: 'active'
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
