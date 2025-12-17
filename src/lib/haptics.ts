'use client';

export const canVibrate = (): boolean => {
  if (typeof window !== 'undefined' && 'vibrate' in window.navigator) {
    return true;
  }
  console.warn('Vibration API not supported.');
  return false;
};

export const vibrate = (pattern: number | number[]) => {
  if (canVibrate()) {
    try {
      window.navigator.vibrate(pattern);
    } catch (e) {
      console.error('Vibration failed:', e);
    }
  }
};

export const VIBRATION_PATTERNS = {
  RUMBLE: [200, 100, 200],
  DRIP: 50,
  CLICK: 10,
  START_EXPERIENCE: [50, 100, 50, 100, 150],
};
