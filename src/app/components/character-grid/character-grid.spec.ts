import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterGrid } from './character-grid';

describe('CharacterGrid', () => {
  let component: CharacterGrid;
  let fixture: ComponentFixture<CharacterGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
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
