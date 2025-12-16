import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DeviceService } from './device.service';

export type Mood = {
  name: string;
  emoji: string;
  arg: string;
  description?: string;
  color?: string; // Optional field for mood color
}

@Injectable({ providedIn: 'root' })
export class MoodService {
  constructor(private http: HttpClient, private deviceService: DeviceService) {}

  getMoods(): Observable<Mood[]> {
    return this.http.get<Mood[]>('assets/data/moods.json').pipe(
      map(moods => this.filterMoodsForMobile(moods))
    );
  }

  private filterMoodsForMobile(moods: Mood[]): Mood[] {
    const isMobile = this.deviceService.isMobile();
    
    if (isMobile) {
      return moods.filter(mood => 
        mood.name !== 'Has Chat' && mood.name !== 'Not Chatted'
      );
    }
    
    return moods;
  }
}
