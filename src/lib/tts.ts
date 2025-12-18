'use client';

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (currentAudio.src.startsWith('blob:')) {
      URL.revokeObjectURL(currentAudio.src);
    }
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
}

export function speakLocal(text: string) {
  if (typeof window === 'undefined') return;
  if (!('speechSynthesis' in window)) return;

  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'id-ID';
  u.rate = 0.9;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}

let ttsSession = 0;

export async function speakPro(text: string) {
  const session = ++ttsSession;
  stopSpeaking();

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (session !== ttsSession) return;

    if (!res.ok) {
      // Always read error as text first. It's the safest.
      const errorText = await res.text();
      console.error('TTS API Error:', errorText || `HTTP ${res.status}`);
      speakLocal('Maaf, narasi pro tidak tersedia saat ini. ' + text);
      return;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('audio/')) {
      const blob = await res.blob();
      if (session !== ttsSession) return;

      const url = URL.createObjectURL(blob);
      currentAudio = new Audio(url);
      currentAudio.onended = () => {
        if (currentAudio?.src.startsWith('blob:')) {
          URL.revokeObjectURL(currentAudio.src);
        }
        currentAudio = null;
      };
      await currentAudio.play();
    } else {
      console.warn('TTS API returned success, but content-type was not audio.', `Type: ${contentType}`);
      speakLocal(text);
    }
  } catch (e: any) {
    if (session !== ttsSession) return;
    console.error('TTS fetch failed:', e?.message || e);
    speakLocal(text);
  }
}
