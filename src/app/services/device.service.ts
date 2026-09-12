import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  /**
   * Basic mobile device detection, excluding iPads.
   */
  isMobile(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    if (this.isIPad()) return false;

    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobileUserAgent;
  }

  /**
   * Detect specifically phones (excludes tablets)
   * Returns true only for phone-sized devices
   */
  isPhone(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    if (this.isIPad()) return false;

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

  /** Detect iPads, including those using a desktop user agent. */
  private isIPad(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /ipad/i.test(navigator.userAgent) ||
      (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  }

  /** Detect iOS devices (iPhone, iPad, iPod) */
  isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    // Check traditional user agent
    const isIOSUserAgent = /iphone|ipad|ipod/i.test(navigator.userAgent);
    
    // For iPadOS 13+, check for touch support on Mac-like devices
    const isMacLike = /Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.userAgent);
    const hasTouchPoints = (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ? true : false;
    
    return isIOSUserAgent || (isMacLike && hasTouchPoints);
  }
}
