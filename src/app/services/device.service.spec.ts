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

  it('should detect device types consistently', () => {
    // The sum of phone + tablet + desktop should equal total device checks
    const isPhone = service.isPhone();
    const isTablet = service.isTablet();
    const isDesktop = service.isDesktop();
    const isMobile = service.isMobile();

    // Mobile should be true if either phone or tablet
    expect(isMobile).toBe(isPhone || isTablet);

    // Desktop should be opposite of mobile
    expect(isDesktop).toBe(!isMobile);

    // Device type should match individual checks
    const deviceType = service.getDeviceType();
    if (isPhone) {
      expect(deviceType).toBe('phone');
    } else if (isTablet) {
      expect(deviceType).toBe('tablet');
    } else {
      expect(deviceType).toBe('desktop');
    }
  });
});