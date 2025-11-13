import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type Mood = {
  name: string;
  emoji: string;
  arg: string;
  description?: string;
  color?: string; // Optional field for mood color
}

@Injectable({ providedIn: 'root' })
export class MoodService {
  constructor(private http: HttpClient) {}

  getMoods(): Observable<Mood[]> {
    return this.http.get<Mood[]>('assets/moods.json').pipe(
      map(moods => this.filterMoodsForMobile(moods))
    );
  }

  private filterMoodsForMobile(moods: Mood[]): Mood[] {
    const isMobile = this.isMobileDevice();
    
    if (isMobile) {
      return moods.filter(mood => 
        mood.name !== 'Has Chat' && mood.name !== 'Not Chatted'
      );
    }
    
    return moods;
  }

  private isMobileDevice(): boolean {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Check for mobile devices
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    
    // Also check for screen size as additional mobile indicator
    const isMobileScreen = window.innerWidth <= 768;
    
    return mobileRegex.test(userAgent.toLowerCase()) || isMobileScreen;
  }
}
