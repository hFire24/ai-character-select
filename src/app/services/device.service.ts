import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  /**
   * Basic mobile device detection (phones and tablets)
   * Returns true for any mobile device including tablets
   */
  isMobile(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    const isMobileWidth = window.innerWidth <= 768;
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobileWidth || isMobileUserAgent;
  }

  /**
   * Detect specifically phones (excludes tablets)
   * Returns true only for phone-sized devices
   */
  isPhone(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isPhone = /android|webos|iphone|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(navigator.userAgent);
    
    // If it's specifically identified as a tablet, return false
    if (isTablet && !isPhone) {
      return false;
    }
    
    // For phones, check screen dimensions - phones have at least one small dimension even in landscape
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const minDimension = Math.min(screenWidth, screenHeight);
    const maxDimension = Math.max(screenWidth, screenHeight);
    
    // Phone detection: either explicitly identified as phone OR has phone-like dimensions
    // Even in landscape, phones typically have a narrow dimension (height) < 450px
    const hasPhoneDimensions = minDimension <= 450 && maxDimension >= 600;
    
    return isPhone || hasPhoneDimensions;
  }

  /**
   * Detect tablets specifically
   * Returns true for tablet-sized devices
   */
  isTablet(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(navigator.userAgent);
    const isPhone = /android|webos|iphone|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
    
    // If explicitly identified as tablet and not phone
    if (isTablet && !isPhone) {
      return true;
    }
    
    // Check for tablet-like dimensions (larger than phone but with touch interface)
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const minDimension = Math.min(screenWidth, screenHeight);
    
    // Tablet detection: mobile user agent but larger dimensions
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTabletDimensions = minDimension > 450 && minDimension <= 768;
    
    return isMobileUA && hasTabletDimensions;
  }

  /**
   * Check if device is desktop
   * Returns true for desktop/laptop devices
   */
  isDesktop(): boolean {
    return !this.isMobile();
  }

  /**
   * Get device type as string
   * Returns 'phone', 'tablet', or 'desktop'
   */
  getDeviceType(): 'phone' | 'tablet' | 'desktop' {
    if (this.isPhone()) return 'phone';
    if (this.isTablet()) return 'tablet';
    return 'desktop';
  }
}