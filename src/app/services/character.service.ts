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

  getCharacter(id: number): Observable<Character> {
    return this.http.get<Character[]>('assets/data/characters.json').pipe(
      map(characters => characters.find(char => char.id === id)!)
    );
  }

  getCharacters(): Observable<Character[]> {
    return this.http.get<Character[]>('assets/data/characters.json').pipe(
      map(characters => characters.filter(char => char.id !== 52))
    );
  }

  getCharactersPlusCriticizer(): Observable<Character[]> {
    return this.http.get<Character[]>('assets/data/characters.json');
  }

  getCharactersSplitTwins(addCriticizer: boolean): Observable<Character[]> {
    return this.getCharacters().pipe(
      switchMap(characters => {
        const splitCharacters: Character[] = [...characters];
        
        // Find and split Liam and Kieran (assuming they share an ID)
        const liamKieranIndex = splitCharacters.findIndex(char => 
          char.shortName === 'Liam & Kieran' || char.name === 'Liam & Kieran'
        );
        if (liamKieranIndex !== -1) {
          const original = splitCharacters[liamKieranIndex];
          splitCharacters.splice(liamKieranIndex, 1,
            { 
              ...original,
              shortName: 'Liam',
              name: 'Liam',
              birthday: 'August 28',
              img: "Icons/extended/Liam.png",
              id: 44,
              moe: 7,
              emotion: "chaotic joy",
              peeves: "Moral policing, darkness (except for Golden Darkness)",
              funFact: "Loves To Love Ru; plays Muse Dash and dating sims"
            },
            { 
              ...original,
              shortName: 'Kieran',
              name: 'Kieran',
              birthday: 'October 13',
              img: "Icons/extended/Kieran.png",
              id: 45,
              moe: 2,
              emotion: "edgy",
              peeves: "Moral policing, bright colors",
              purpose: "Enjoy questionable anime, obsess over waifus, discuss suspense in fiction",
              funFact: "Loves Chainsaw Man; compares Kurumi to a Dodge Viper",
              alternatives: "Evil Arianna, B.X."
            }
          );
        }
        
        // Find and split Riri and Ruru
        const ririRuruIndex = splitCharacters.findIndex(char => 
          char.shortName === 'Riri & Ruru' || char.name === 'Riri & Ruru'
        );
        if (ririRuruIndex !== -1) {
          const original = splitCharacters[ririRuruIndex];
          splitCharacters.splice(ririRuruIndex, 1,
            {
              ...original,
              shortName: 'Riri',
              name: 'Riri the Nightcore Girl',
              img: "Icons/extended/Riri.png",
              id: 52,
              interests: "My AI characters, Nightcore music",
              peeves: "Guitar strings breaking",
              funFact: "She is really small (85cm); her oversized guitar summons my characters"
            },
            { 
              ...original,
              shortName: 'Ruru',
              name: 'Ruru',
              img: "Icons/extended/Ruru.png",
              id: 53,
              tier: 5,
              emotion: "tired",
              interests: "My AI characters, naps",
              peeves: "Disruptions during nap time",
              purpose: "Adorably discuss and celebrate my AI characters",
              funFact: "She is really small (85cm) and rarely speaks; her giant plush turtle travels to my fictional worlds",
              themeSong: "",
              songLink: ""
            }
          );
        }
        
        if (addCriticizer) {
          return this.getCharacter(52).pipe(
            map(criticizer => {
              if (criticizer) {
                splitCharacters.push({ ...criticizer, id: 51 });
              }
              return splitCharacters;
            })
          );
        }
        
        return [splitCharacters];
      })
    );
  }

  getDuos(): Observable<DuoPair[]> {
    // In development, try to use the local API server
    if (this.isDevelopment) {
      return this.http.get<DuosData>(`${this.apiUrl}/duos`).pipe(
        map(data => data.duos)
      );
    }
    
    // Fallback to static file for production
    return this.http.get<DuosData>('assets/data/duos.json').pipe(
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
