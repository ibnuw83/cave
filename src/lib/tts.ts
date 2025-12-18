
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
    // Hentikan juga Web Speech API jika sedang berjalan
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
}


type TtsApiError = {
  error?: string;
  details?: string;
};

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

// ---- main: PRO TTS ----
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
      // If the response is not OK, it should be a JSON error object from our API
      try {
        const err: TtsApiError = await res.json();
        console.error('TTS API Error:', err.details || err.error || `HTTP ${res.status}`);
      } catch (e) {
        // If parsing the error response fails, log the raw text
        const errorText = await res.text();
        console.error('TTS API Error (non-JSON):', errorText || `HTTP ${res.status}`);
      }
      speakLocal('Maaf, narasi pro tidak tersedia saat ini. ' + text);
      return;
    }

    // If the response is OK, it must be a binary audio stream
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('audio/')) {
        const blob = await res.blob();
        if (session !== ttsSession) return; // Check again after await

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
        // This case should not happen if the API is working correctly
        console.warn('TTS API returned success, but content-type was not audio.', `Type: ${ct}`);
        speakLocal(text);
    }
    
  } catch (e: any) {
    if (session !== ttsSession) return;
    console.error('TTS fetch failed:', e?.message || e);
    speakLocal(text);
  }
}
