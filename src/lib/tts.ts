
'use client';

let currentAudio: HTMLAudioElement | null = null;
let ttsSession = 0;

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


export async function speakPro(text: string, audioUrl?:string) {
  const session = ++ttsSession;
  stopSpeaking();
  
  if(audioUrl){
    currentAudio = new Audio(audioUrl);
    await currentAudio.play();
    return;
  }

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (session !== ttsSession) return;

    if (!res.ok) {
        let errorText;
        try {
            // Try to parse as JSON first for detailed error
            const errorJson = await res.clone().json();
            errorText = errorJson.error?.message || errorJson.error || JSON.stringify(errorJson);
        } catch {
            // Fallback to raw text if not JSON
            errorText = await res.text();
        }
      console.error('TTS API Error:', errorText || `HTTP ${res.status}`);
      speakLocal('Maaf, narasi pro tidak tersedia saat ini. ' + text);
      return;
    }

    // Handle 204 No Content gracefully
    if (res.status === 204) {
      console.warn("TTS API returned a success status but no content. Falling back to local TTS.");
      speakLocal(text);
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
