'use client';

let proAudio: HTMLAudioElement | null = null;

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
  window.speechSynthesis.speak(u);
}

/**
 * PRO: OpenAI TTS API (suara "radio announcer")
 * Membutuhkan server & API key.
 */
export async function speakPro(text: string): Promise<void> {
  if (typeof window === 'undefined') return;
  stopSpeaking(); // Hentikan narasi sebelumnya

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: 'onyx' }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        console.error("TTS API Error:", errorData.details || errorData.error);
        // Fallback ke TTS lokal jika API gagal
        speakLocal("Maaf, narasi pro tidak tersedia saat ini. " + text);
        return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    
    proAudio = new Audio(url);
    await proAudio.play();
    
    proAudio.onended = () => {
        URL.revokeObjectURL(url);
        proAudio = null;
    }

  } catch (error) {
      console.error("Failed to play PRO audio:", error);
      // Fallback ke TTS lokal jika ada kesalahan jaringan
      speakLocal("Maaf, narasi pro tidak dapat dimuat. " + text);
  }
}

/**
 * Hentikan semua jenis narasi yang sedang berjalan.
 */
export function stopSpeaking() {
  if (typeof window === 'undefined') return;

  // Hentikan Web Speech API
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  
  // Hentikan audio dari OpenAI
  if (proAudio) {
    proAudio.pause();
    proAudio.currentTime = 0;
    if(proAudio.src) {
        URL.revokeObjectURL(proAudio.src);
    }
    proAudio = null;
  }
}
