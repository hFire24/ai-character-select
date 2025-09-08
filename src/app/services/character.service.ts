import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Character = {
  shortName: string;
  img: string;
  generation: number;
  type: string;
  // Add other fields as needed
  name: string;
  serious: boolean;
  chaos: boolean;
  musicEnjoyer?: boolean; // Optional field for music enjoyment
  moe: number;
  emotion: string;
  pronouns: string;
  link: string;
  interests: string;
  peeves?: string; // Optional field for pet peeves
  bestFor: string;
  funFact: string;
  description: string;
  retirementReason?: string; // Optional field for retirement reason
  inactiveReason?: string; // Optional field for inactive reason
}

@Injectable({ providedIn: 'root' })
export class CharacterService {
  constructor(private http: HttpClient) {}

  getCharacters(): Observable<Character[]> {
    return this.http.get<Character[]>('assets/characters.json');
  }
}
