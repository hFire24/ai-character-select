import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Character } from './character.service';
import { DeviceService } from './device.service';
import { Mood, MoodService } from './mood.service';

describe('MoodService', () => {
  let service: MoodService;
  let http: jasmine.SpyObj<HttpClient>;
  let device: jasmine.SpyObj<DeviceService>;

  const mood = (arg: string, selectable = true): Mood => ({
    name: arg, emoji: '', arg, selectable
  });
  const character = (overrides: Partial<Character> = {}): Character => ({
    id: 1, name: 'Test', shortName: 'Test', img: '', generation: 1,
    status: 'active', tier: 4, color: 'blue', moe: 1, futuristic: 1,
    mature: 1, emotion: '', pronouns: 'he/him', link: '', interests: '',
    purpose: '', funFact: '', description: '', ...overrides
  });

  beforeEach(() => {
    http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);
    device = jasmine.createSpyObj<DeviceService>('DeviceService', ['isMobile']);
    service = new MoodService(http, device);
  });

  for (const mobile of [false, true]) {
    it(`only offers selectable moods on ${mobile ? 'mobile' : 'desktop'}`, () => {
      const visible = mood('favorites');
      http.get.and.returnValue(of([mood('rp', false), visible, mood('none', false)]));
      device.isMobile.and.returnValue(mobile);
      service.getMoods().subscribe(moods => expect(moods).toEqual([visible]));
    });
  }

  it('applies mood rules together with status and tier limits', () => {
    const active = character({ futuristic: 7 });
    const inactive = character({ status: 'inactive', futuristic: 8 });
    const retired = character({ status: 'retired', futuristic: 9 });
    const tooHigh = character({ tier: 9, futuristic: 10 });
    const traditional = character({ futuristic: 4 });
    const characters = [active, inactive, retired, tooHigh, traditional];
    expect(service.filterCharacters(characters, mood('futuristic'))).toEqual([active]);
    expect(service.filterCharacters(characters, mood('futuristic'), {
      showInactive: true, showRetired: true
    })).toEqual([active, inactive, retired]);
  });

  it('includes pink characters in the moe mood regardless of their moe score', () => {
    const pink = character({ color: 'pink' });
    const highMoe = character({ moe: 10 });
    expect(service.filterCharacters([character(), pink, highMoe], mood('moe')))
      .toEqual([pink, highMoe]);
  });

  it('sorts favorites by tier across statuses without reordering the source', () => {
    const third = character({ tier: 3, status: 'inactive' });
    const first = character({ tier: 1, status: 'retired' });
    const second = character({ tier: 2 });
    const characters = [third, first, second, character()];
    expect(service.filterCharacters(characters, mood('favorites'))).toEqual([first, second, third]);
    expect(characters[0]).toBe(third);
  });

  it('keeps the random fallback limited by status without the mood tier cap', () => {
    const active = character({ tier: 9 });
    const inactive = character({ status: 'inactive' });
    const side = character({ status: 'side' });
    expect(service.filterCharactersByStatus([active, inactive, side])).toEqual([active]);
    expect(service.filterCharactersByStatus([active, inactive, side], { showInactive: true }))
      .toEqual([active, inactive]);
  });
});
