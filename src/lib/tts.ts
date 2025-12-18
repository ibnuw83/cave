
'use client';

// Hentikan audio yang sedang diputar
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


type TtsApiSuccess = {
  audioBase64?: string; // kalau server kirim base64
  audioUrl?: string;    // atau URL audio
};

type TtsApiError = {
  error?: string;
  details?: string;
};

// ---- helpers: safe read response ----
async function readResponseBody(res: Response): Promise<{ text: string; json: any | null }> {
  // clone biar aman kalau mau dibaca dua kali
  const cloned = res.clone();

  // coba ambil text dulu (paling aman)
  let text = '';
  try {
    text = await cloned.text();
  } catch {
    text = '';
  }

  // kalau kosong, stop
  if (!text || !text.trim()) return { text: '', json: null };

  // coba parse JSON kalau memungkinkan
  try {
    const json = JSON.parse(text);
    return { text, json };
  } catch {
    return { text, json: null };
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

// ---- main: PRO TTS ----
export async function speakPro(text: string) {
  stopSpeaking(); // Hentikan audio/speech sebelumnya
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const { text: raw, json } = await readResponseBody(res);

    if (!res.ok) {
      // kalau server ngirim JSON error → pakai itu
      const err: TtsApiError =
        (json && typeof json === 'object' ? json : null) || {
          error: raw ? raw.slice(0, 400) : `HTTP ${res.status}`,
        };

      console.error('TTS API Error:', err.details || err.error || `HTTP ${res.status}`);
      speakLocal('Maaf, narasi pro tidak tersedia saat ini. ' + text);
      return;
    }

    // sukses: bisa JSON, bisa kosong (misconfig), bisa audio binary
    // 1) kalau JSON
    if (json && typeof json === 'object') {
      const data = json as TtsApiSuccess;

      if (data.audioUrl) {
        currentAudio = new Audio(data.audioUrl);
        await currentAudio.play();
        return;
      }

      if (data.audioBase64) {
        currentAudio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
        await currentAudio.play();
        return;
      }
    }
    
    // 2) kalau bukan JSON, mungkin server balikin audio binary
    // cek content-type
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('audio/')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        currentAudio = new Audio(url);
        currentAudio.onended = () => URL.revokeObjectURL(url);
        await currentAudio.play();
        return;
    }


    // 3) kalau sampai sini berarti response sukses tapi format nggak sesuai
    console.warn('TTS API success but no playable audio returned. Raw:', raw?.slice(0, 200));
    speakLocal(text);
  } catch (e: any) {
    console.error('TTS fetch failed:', e?.message || e);
    speakLocal(text);
  }
}
