'use client';

let wakeLockSentinel: any = null;

export async function enterKioskLock() {
  // fullscreen
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch {}

  // orientation lock (works on some Android browsers in fullscreen)
  try {
    const anyScreen: any = screen;
    if (anyScreen.orientation?.lock) {
      await anyScreen.orientation.lock('landscape');
    }
  } catch {}

  // wake lock (keep screen on)
  try {
    const navAny: any = navigator;
    if (navAny.wakeLock?.request) {
      wakeLockSentinel = await navAny.wakeLock.request('screen');
    }
  } catch {}
}

export async function exitKioskLock() {
  // wake lock release
  try {
    if (wakeLockSentinel) await wakeLockSentinel.release();
  } catch {}
  wakeLockSentinel = null;

  // unlock orientation
  try {
    const anyScreen: any = screen;
    if (anyScreen.orientation?.unlock) anyScreen.orientation.unlock();
  } catch {}

  // exit fullscreen
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {}
}
