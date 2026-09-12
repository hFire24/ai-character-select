import { TestBed } from '@angular/core/testing';
import { DeviceService } from './device.service';

describe('DeviceService', () => {
  let service: DeviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  for (const width of [390, 1024]) {
    it(`keeps desktop features available at width ${width}`, () => {
      spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(width);
      expect(service.isMobile()).toBeFalse();
    });

    it(`treats iPhones as mobile at width ${width}`, () => {
      spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)');
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(width);
      expect(service.isMobile()).toBeTrue();
      expect(service.isIOS()).toBeTrue();
    });

    for (const userAgent of ['Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)']) {
      it(`excludes iPads from mobile at width ${width}: ${userAgent}`, () => {
        spyOnProperty(navigator, 'userAgent', 'get').and.returnValue(userAgent);
        spyOnProperty(navigator, 'maxTouchPoints', 'get').and.returnValue(5);
        spyOnProperty(window, 'innerWidth', 'get').and.returnValue(width);
        expect(service.isMobile()).toBeFalse();
        expect(service.isPhone()).toBeFalse();
        expect(service.isIOS()).toBeTrue();
      });
    }
  }
});
