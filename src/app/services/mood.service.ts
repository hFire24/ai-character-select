import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    return this.http.get<Mood[]>('assets/moods.json');
  }
}
