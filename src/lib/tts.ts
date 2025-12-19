
'use client';

// This file is now used for both browser TTS and for controlling AI-generated audio
// to provide a single, unified interface for speech control.

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

// A hack to allow the SpotPlayerUI to assign the dynamically created audio element
// so that it can be stopped by this module.
if (typeof window !== 'undefined') {
    (window as any).currentAudio = null;
}

function stopSpeechSynthesis() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    if (currentUtterance) {
      currentUtterance.onend = null; // Prevent onEnd from firing after manual stop
      currentUtterance = null;
    }
    window.speechSynthesis.cancel();
  }
}

function stopAudioElement() {
  // Use the globally assigned audio element if it exists
  const audioToStop = currentAudio || (typeof window !== 'undefined' ? (window as any).currentAudio : null);
  if (audioToStop) {
    audioToStop.pause();
    audioToStop.currentTime = 0;
    if (audioToStop.src && audioToStop.src.startsWith('blob:')) {
      URL.revokeObjectURL(audioToStop.src);
    }
    currentAudio = null;
    if (typeof window !== 'undefined') {
      (window as any).currentAudio = null;
    }
  }
}

/**
 * Stops any currently playing audio, whether it's from the Web Speech API
 * or an <audio> element from the AI narration.
 */
export function stopSpeaking() {
  stopAudioElement();
  stopSpeechSynthesis();
}

/**
 * Uses the browser's built-in Web Speech API for text-to-speech.
 * This is used as a fallback if the AI narration fails.
 * @param text The text to be spoken.
 * @param onEnd Callback to be executed when speech is finished.
 */
export function speak(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Web Speech API tidak didukung di browser ini.');
    onEnd?.();
    return;
  }

  stopSpeaking(); // Ensure nothing else is playing

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'id-ID';
  u.rate = 0.95;
  u.pitch = 1.1;
  u.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };
  
  currentUtterance = u;
  window.speechSynthesis.speak(u);
}

    