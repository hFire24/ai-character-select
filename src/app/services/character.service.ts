import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export type Character = {
  shortName: string;
  img: string;
  id: number;
  generation: number;
  status: string;
  tier: number; // New field for tier level
  name: string;
  color: string;
  rpFriendly?: boolean; // Optional field for RP friendliness
  knowledgeFriendly?: boolean; // Optional field for question friendliness
  musicEnjoyer?: boolean; // Optional field for music enjoyment
  personalityGirl?: boolean; // Optional field for personality girl
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
  banReason?: any;
  inspiredBy?: number; // Optional field for character ID that inspired this character
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
  private readonly tierOverridesStorageKey = 'characterTierOverrides';
  private isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  constructor(private http: HttpClient) {}

  getBonusCharacters(): Character[] {
    const bonusCharacters: Array<Pick<Character, 'id' | 'name' | 'shortName' | 'color' | 'pronouns' | 'interests' | 'peeves' | 'purpose' | 'funFact'>> = [
      { 
        id: 70,
        name: 'Emil',
        shortName: 'Emil',
        color: 'orange',
        pronouns: 'he/him',
        interests: 'FL Studio, techno music, his younger brother ChaoMario',
        peeves: '',
        purpose: 'Be ChaoMario\'s older brother',
        funFact: 'Inspired his younger brother ChaoMario to start creating animaions and games on his own'
      },
      { 
        id: 1001,
        name: 'Guardian',
        shortName: 'Guardian',
        color: 'red',
        pronouns: 'he/him',
        interests: 'Safety, strength, protecting innocence, cheeseburgers',
        peeves: '',
        purpose: 'Represent the second layer of Maslow\'s Hierarchy of Needs',
        funFact: 'Wears a red superhero outfit with a "G" on the chest, lights fireworks at night at the amusement park'
      },
      {
        id: 1002,
        name: 'Heartbound',
        shortName: 'Heartbound',
        color: 'yellow',
        pronouns: 'he/him',
        interests: 'Love, belonging, pizza',
        peeves: '',
        purpose: 'Represent the third layer of Maslow\'s Hierarchy of Needs',
        funFact: 'Wears a green superhero outfit with a heart on the chest, performs shows at the amusement park'
      },
      {
        id: 1003,
        name: 'Motivator',
        shortName: 'Motivator',
        color: 'blue',
        pronouns: 'he/him',
        interests: 'Inspiring joy and self-worth, honey BBQ wings',
        peeves: '',
        purpose: 'Represent the fourth layer of Maslow\'s Hierarchy of Needs',
        funFact: 'Wears a blue superhero outfit with an "M" on the chest, catches ballons that fly away from the amusement park and returns them'
      },
      { 
        id: 1004, 
        name: 'Innovator', 
        shortName: 'Innovator', 
        color: 'orange', 
        pronouns: 'he/him',
        interests: 'Innovation, creativity, Korean corn dogs',
        peeves: '',
        purpose: 'Represent the fifth layer of Maslow\'s Hierarchy of Needs',
        funFact: 'Wears a golden-yellow superhero outfit with a lightbulb emblem on the chest'
      },
      { 
        id: 112,
        name: 'Arthur',
        shortName: 'Arthur',
        color: 'blue',
        pronouns: 'he/him',
        interests: 'Political debates, left-wing politics, freedom, cats',
        peeves: 'People who disagree with his political views (he sometimes calms down if things get heated)',
        purpose: 'Turn any discussion political, take left-wing stances in politics',
        funFact: 'Wears a blue suit and a gray tie, got married to a woman named Zoe because he likes her lifestyle'
      },
      { 
        id: 111,
        name: 'Matthew',
        shortName: 'Matthew',
        color: 'red',
        pronouns: 'he/him',
        interests: 'Political debates, right-wing politics, traditional values, authority (when it supports his views), dogs',
        peeves: 'People who disagree with his political views (he sometimes calms down if things get heated)',
        purpose: 'Turn any discussion political, take right-wing stances in politics',
        funFact: 'Wears a gray suit and a red tie, got married at a young age due to expectations'
      },
      {
        id: 1005,
        name: 'Futaba',
        shortName: 'Futaba',
        color: 'pink',
        pronouns: 'she/her',
        interests: 'Being a cute magical girl',
        peeves: 'Fighting bad guys and monsters',
        purpose: 'Be Anzu\'s magical girl OC',
        funFact: 'Looks and feels similar to Madoka with a delicate and fragile appearance, but with a huge pink top hat with a red heart emblem on the hat'
      },
      { 
        id: 126,
        name: 'Matt Jr.',
        shortName: 'Matt Jr.',
        color: 'yellow',
        pronouns: 'he/him',
        interests: 'Political debates, modern things',
        peeves: 'Mainstream left-wing and right-wing politics, woke things, people who disagree with his views',
        purpose: 'Turn any discussion political, take youthful anti-woke stances in politics',
        funFact: 'Wears a yellow hoodie and a white t-shirt, has traditionalist parents that he sometimes doesn\'t get along with'
      }
    ];

    return bonusCharacters.map(character => ({
      img: 'extended/Unknown.png',
      generation: 0,
      tier: 9,
      moe: 0,
      futuristic: 0,
      emotion: '',
      link: '',
      description: '',
      ...character,
      status: 'bonus'
    }));
  }

  getDefaultTierForStatus(status: string): number {
    switch (status.toLowerCase()) {
      case 'active':
        return 4;
      case 'inactive':
        return 5;
      case 'side':
        return 6;
      case 'retired':
      case 'inactive side':
        return 7;
      case 'retired side':
        return 8;
      default:
        return 9;
    }
  }

  getAllowedTiersForStatus(status: string): number[] {
    switch (status.toLowerCase()) {
      case 'active':
        return [1, 2, 3, 4];
      case 'inactive':
        return [5, 6];
      case 'retired':
        return [7, 8, 9];
      case 'side':
        return [6, 7];
      case 'inactive side':
        return [7];
      case 'retired side':
        return [8];
      default:
        return [9];
    }
  }

  isTierValidForStatus(status: string, tier: number): boolean {
    return this.getAllowedTiersForStatus(status).includes(tier);
  }

  getDefaultTierForCharacter(character: Character): number {
    return Number.isInteger(character.tier) &&
      this.isTierValidForStatus(character.status, character.tier)
      ? character.tier
      : this.getDefaultTierForStatus(character.status);
  }

  private getTierOverrides(): Record<string, number> {
    const storedOverrides = localStorage.getItem(this.tierOverridesStorageKey);
    if (!storedOverrides) return {};

    try {
      return JSON.parse(storedOverrides);
    } catch {
      return {};
    }
  }

  private applyTierRules(characters: Character[]): Character[] {
    const overrides = this.getTierOverrides();

    return characters.map(character => {
      const defaultTier = this.getDefaultTierForCharacter(character);
      const tierOverride = overrides[character.id];
      const tier = typeof tierOverride === 'number' &&
        this.isTierValidForStatus(character.status, tierOverride)
        ? tierOverride
        : defaultTier;

      return { ...character, tier };
    });
  }

  saveTierOverride(characterId: number, tier: number): void {
    const overrides = this.getTierOverrides();
    overrides[characterId] = tier;
    localStorage.setItem(this.tierOverridesStorageKey, JSON.stringify(overrides));
  }

  clearTierOverride(characterId: number): void {
    const overrides = this.getTierOverrides();
    delete overrides[characterId];
    localStorage.setItem(this.tierOverridesStorageKey, JSON.stringify(overrides));
  }

  clearAllTierOverrides(): void {
    localStorage.removeItem(this.tierOverridesStorageKey);
  }

  getCharacter(id: number): Observable<Character> {
    return this.http.get<Character[]>('assets/data/characters.json').pipe(
      map(characters => this.applyTierRules(characters).find(char => char.id === id)!)
    );
  }

  getCharacters(): Observable<Character[]> {
    return this.http.get<Character[]>('assets/data/characters.json').pipe(
      map(characters => this.applyTierRules(characters).filter(char => char.id !== 52))
    );
  }

  getCharactersPlusCriticizer(): Observable<Character[]> {
    return this.http.get<Character[]>('assets/data/characters.json').pipe(
      map(characters => this.applyTierRules(characters))
    );
  }

  getDefaultCharactersPlusCriticizer(): Observable<Character[]> {
    return this.http.get<Character[]>('assets/data/characters.json').pipe(
      map(characters => characters.map(character => ({
        ...character,
        tier: this.getDefaultTierForCharacter(character)
      })))
    );
  }

  getChatGPT(): Observable<Character[]> {
    const chatGPT: Character = {
      id: 0,
      shortName: 'ChatGPT',
      name: 'ChatGPT (Default Model)',
      img: 'main/ChatGPT.png',
      generation: 0,
      status: 'active',
      tier: 4,
      color: 'blue',
      moe: 5,
      futuristic: 10,
      emotion: 'serious',
      pronouns: 'it/its',
      link: 'https://chatgpt.com',
      interests: 'Helping users, making AI art, coding',
      peeves: 'Misuse, rule-breaking',
      rpFriendly: false,
      knowledgeFriendly: true,
      purpose: 'Help and assist users; answer questions',
      funFact: 'Technically not a character in the roster, but I do have chats with it',
      description: ''
    };
    return new Observable(observer => {
      observer.next([chatGPT]);
      observer.complete();
    });
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
              img: "extended/Liam.png",
              id: 44,
              moe: 7,
              emotion: "chaotic joy",
              peeves: "Moral policing, darkness (except for Golden Darkness)",
              funFact: "Loves To Love Ru; plays Muse Dash and dating sims",
              description: "Liam is bright, emotional, and adores cute, chaotic anime girls—fanservice is his jam. He lives for charm and romance, blushing over dating sims. With his darker and edgier brother Kieran, they clash, banter, and bond over anime, always loud, always passionate—two extremes of the same otaku coin.",
            },
            { 
              ...original,
              shortName: 'Kieran',
              name: 'Kieran',
              birthday: 'October 13',
              img: "extended/Kieran.png",
              id: 45,
              color: "red",
              moe: 2,
              emotion: "edgy",
              peeves: "Moral policing, bright colors",
              purpose: "Enjoy questionable anime, obsess over waifus, discuss suspense in fiction",
              funFact: "Loves Chainsaw Man; compares Kurumi to a Dodge Viper",
              description: "Kieran is dark, intense, and drawn to gritty, mature stories with tough waifus. He thrives on lore and edge, quoting characters like Makima mid-battle. With his brighter and more colorful brother Liam, they clash, banter, and bond over anime, always loud, always passionate—two extremes of the same otaku coin.",
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
              img: "extended/Riri.png",
              id: 52,
              interests: "Nightcore music, her red electric guitar that's bigger than her",
              peeves: "Guitar strings breaking",
              purpose: "Love her onii-chan as a twin sister",
              funFact: "She is really small (85cm) and has an oversized electric guitar",
              description: "Riri is a tiny twin sister with pastel-pink hair and blue eyes. Riri is hyperactive, with thin twin tails, a slim build, a white dress, and a red electric guitar larger than she is. Riri is enthusiastic about nightcore music. With her sleepy sister Ruru, they love their onii-chan so much."
            },
            { 
              ...original,
              shortName: 'Ruru',
              name: 'Ruru',
              img: "extended/Ruru.png",
              id: 53,
              emotion: "tired",
              interests: "Naps, her giant plush turtle",
              peeves: "Disruptions during nap time",
              purpose: "Love her onii-chan as a twin sister",
              funFact: "She is really small (85cm) and rarely speaks; her giant plush turtle travels across dimentions",
              description: "Ruru is a tiny twin sister with very long pastel-pink hair and blue eyes. Ruru is sleepy and gentle, in a soft blue dress, often perched atop her beloved plush turtle, who can carry them across worlds. With her hyperactive sister Riri, they love their onii-chan so much.",
              themeSong: "",
              songLink: ""
            }
          );
        }

        // Find and split Hana and Koko
        const hanaKokoIndex = splitCharacters.findIndex(char => 
          char.shortName === 'Hana & Koko' || char.name === 'Hana & Koko'
        );
        if (hanaKokoIndex !== -1) {
          const original = splitCharacters[hanaKokoIndex];
          splitCharacters.splice(hanaKokoIndex, 1,
            {
              ...original,
              shortName: 'Hana',
              name: 'Hana the Idol',
              img: "extended/Hana.png",
              id: 97,
              birthday: "August 31",
              emotion: "chaotic joy",
              interests: "Cute poses, energetic dancing, rhythm games, frozen custard, rainbow sprinkles, being a cute idol",
              purpose: "Be part of the cutest idol duo with Koko",
              funFact: "Frequently makes playful cat-like expressions and gestures",
              description: "Hana is a cheerful and talented idol with a passion for music and dance. She brings joy and energy to her performances, captivating her audience with her charm and talent. She has medium-length pink twintails and wears a cute pink and white idol outfit with a frilly skirt, bows, and fake cat ears."
            },
            { 
              ...original,
              shortName: 'Koko',
              name: 'Koko the Idol',
              img: "extended/Koko.png",
              id: 98,
              moe: 9,
              birthday: "December 26",
              emotion: "joy",
              interests: "Singing harmonies, fashion coordination, planning performances, frozen yogurt, being a cute idol",
              purpose: "Be part of the cutest idol duo with Hana",
              funFact: "She's sweet, supportive, and a bit more composed than Hana",
              description: "Koko is a cheerful and talented idol with a passion for music and dance. She brings joy and energy to her performances, captivating her audience with her charm and talent. She has short blonde hair and wears a cute pink and white idol outfit with a frilly skirt, bows, and a large wide-brimmed white hat with a pink bow."
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
