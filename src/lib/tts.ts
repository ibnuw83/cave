// This file is no longer used for primary TTS but kept as a potential fallback.
'use client';

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

function stopSpeechSynthesis() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    if (currentUtterance) {
      currentUtterance.onend = null;
      currentUtterance = null;
    }
    window.speechSynthesis.cancel();
  }
}

function stopAudioElement() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (currentAudio.src.startsWith('blob:')) {
      URL.revokeObjectURL(currentAudio.src);
    }
    currentAudio = null;
  }
}

export function stopSpeaking() {
  stopAudioElement();
  stopSpeechSynthesis();
}

/**
 * Menggunakan Web Speech API bawaan browser untuk text-to-speech.
 * Ini gratis dan tidak memerlukan API key.
 * @param text Teks yang akan diucapkan.
 * @param onEnd Callback yang akan dijalankan ketika ucapan selesai.
 */
export function speak(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Web Speech API tidak didukung di browser ini.');
    onEnd?.();
    return;
  }

  stopSpeaking();

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


/**
 * Memainkan file audio dari URL.
 * @param audioUrl URL dari file audio.
 * @param onEnd Callback yang akan dijalankan ketika audio selesai.
 */
export async function playAudioUrl(audioUrl: string, onEnd?: () => void) {
  stopSpeaking();
  
  currentAudio = new Audio(audioUrl);
  currentAudio.onended = () => {
    currentAudio = null;
    onEnd?.();
  };
  
  try {
    await currentAudio.play();
  } catch (error) {
    console.error("Gagal memainkan audio:", error);
    onEnd?.();
  }
}
