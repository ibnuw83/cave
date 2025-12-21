
'use client';

// This file now only handles the browser's built-in SpeechSynthesis API,
// which is used as a fallback. The control of AI-generated audio (<audio> elements)
// is now managed locally within the React component that creates it (SpotPlayerUI).

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Stops any currently playing speech from the browser's Web Speech API.
 */
export function stopSpeechSynthesis() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    if (currentUtterance) {
      currentUtterance.onend = null; // Prevent onEnd from firing after manual stop
      currentUtterance = null;
    }
    window.speechSynthesis.cancel();
  }
}

/**
 * Uses the browser's built-in Web Speech API for text-to-speech.
 * This is used as a fallback if the AI narration fails.
 * @param text The text to be spoken.
 * @param lang The language for the utterance (e.g., 'en-US', 'id-ID').
 * @param onEnd Callback to be executed when speech is finished.
 */
export function speak(text: string, lang: string = 'id-ID', onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Web Speech API tidak didukung di browser ini.');
    onEnd?.();
    return;
  }

  stopSpeechSynthesis(); // Ensure no other utterance is playing

  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.95;
  u.pitch = 1.1;
  u.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };
  
  currentUtterance = u;
  window.speechSynthesis.speak(u);
}
