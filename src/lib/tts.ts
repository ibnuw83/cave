
'use client';

let currentAudio: HTMLAudioElement | null = null;
let currentSpeech: SpeechSynthesisUtterance | null = null;

/**
 * Hentikan semua jenis narasi yang sedang berjalan.
 */
export function stopSpeaking() {
  if (typeof window === 'undefined') return;

  // Hentikan Web Speech API
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    currentSpeech = null;
  }
  
  // Hentikan audio dari API (Gemini/OpenAI)
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (currentAudio.src.startsWith('blob:')) {
        URL.revokeObjectURL(currentAudio.src);
    }
    currentAudio = null;
  }
}

/**
 * Gratis: Web Speech API (TTS lokal)
 * Suara tergantung device.
 */
export function speakLocal(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  
  stopSpeaking(); // Hentikan narasi sebelumnya

  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'id-ID';
  u.rate = 0.9;
  u.pitch = 1.1;
  
  u.onend = () => {
    currentSpeech = null;
  };

  currentSpeech = u;
  window.speechSynthesis.speak(u);
}

/**
 * PRO: Menggunakan API eksternal (sekarang Gemini)
 * Membutuhkan server & API key.
 */
export async function speakPro(text: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  stopSpeaking(); // Hentikan narasi sebelumnya

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: 'gemini-voice' }), // voice is illustrative
    });

    if (!res.ok) {
        // Handle non-OK responses gracefully. Prioritize reading as text.
        const errorText = await res.text();
        let errorData;
        try {
            // Try to parse as JSON, but don't fail if it's not JSON
            errorData = JSON.parse(errorText);
        } catch (e) {
            // If parsing fails, use the raw text as the error message
            errorData = { error: errorText };
        }
        console.error("TTS API Error:", errorData.details || errorData.error || "Unknown error");
        speakLocal("Maaf, narasi pro tidak tersedia saat ini. " + text); // Fallback to local TTS
        return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    
    const audio = new Audio(url);
    currentAudio = audio;
    
    await audio.play();
    
    audio.onended = () => {
        if (audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
        if (currentAudio === audio) {
            currentAudio = null;
        }
    }
    audio.onerror = () => {
        console.error("Audio playback error.");
        if (audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
         if (currentAudio === audio) {
            currentAudio = null;
        }
    }

  } catch (error) {
      console.error("Failed to play PRO audio:", error);
      // Fallback ke TTS lokal jika ada kesalahan jaringan
      speakLocal("Maaf, narasi pro tidak dapat dimuat. " + text);
  }
}
