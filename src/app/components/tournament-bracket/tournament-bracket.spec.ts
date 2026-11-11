import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TournamentBracket } from './tournament-bracket';

describe('TournamentBracket', () => {
  let component: TournamentBracket;
  let fixture: ComponentFixture<TournamentBracket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      imports: [TournamentBracket]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TournamentBracket);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
