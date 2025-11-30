import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export type Character = {
  shortName: string;
  img: string;
  id: number;
  generation: number;
  type: string;
  tier: number; // New field for tier level
  name: string;
  color: string;
  musicEnjoyer?: boolean; // Optional field for music enjoyment
  moe: number;
  futuristic: number; // New field for futuristic level
  emotion: string;
  pronouns: string;
  link: string;
  interests: string;
  peeves?: string; // Optional field for pet peeves
  purpose: string;
  funFact: string;
  description: string;
  retirementReason?: string; // Optional field for retirement reason
  inactiveReason?: string; // Optional field for inactive reason
  alternatives?: string; // Optional field for alternatives
  birthday?: string; // Optional field for birthday
  creationDate?: string; // Optional field for creation date
  themeSong?: string; // Optional field for theme song
  songLink?: string; // Optional field for song link
  seed?: any; // Optional field for tournament seed
  permaSeed?: any; // Optional field for permanent tournament seed
}

export interface DuoPair {
  id1: number;
  id2: number;
  name: string;
  altName?: string;
}

export interface DuosData {
  duos: DuoPair[];
}

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private apiUrl = '/api';
  private isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  constructor(private http: HttpClient) {}

  getCharacters(): Observable<Character[]> {
    return this.http.get<Character[]>('assets/characters.json');
  }

  getDuos(): Observable<DuoPair[]> {
    // In development, try to use the local API server
    if (this.isDevelopment) {
      return this.http.get<DuosData>(`${this.apiUrl}/duos`).pipe(
        map(data => data.duos)
      );
    }
    
    // Fallback to static file for production
    return this.http.get<DuosData>('assets/duos.json').pipe(
      map(data => data.duos)
    );
  }

  addDuo(duo: DuoPair): Observable<DuoPair[]> {
    if (!this.isDevelopment) {
      throw new Error('Adding duos is only available in development mode (localhost)');
    }

    // POST to the local server which will update duos.json
    return this.http.post<{ message: string; duos: DuoPair[] }>(`${this.apiUrl}/duos`, duo).pipe(
      map(response => response.duos)
    );
  }
}
