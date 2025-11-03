import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Character = {
  shortName: string;
  img: string;
  id: number;
  generation: number;
  type: string;
  tier: number; // New field for tier level
  name: string;
  serious: boolean;
  chaos: boolean;
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
}

@Injectable({ providedIn: 'root' })
export class CharacterService {
  constructor(private http: HttpClient) {}

  getCharacters(): Observable<Character[]> {
    return this.http.get<Character[]>('assets/characters.json');
  }
}
