'use client';

import { useEffect, useRef, useState } from 'react';
import { doc, increment, serverTimestamp, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import Script from 'next/script';

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function VisitorCounter({
  kioskId,
  enabled = true,
  cooldownMs = 8000,
}: {
  kioskId: string;
  enabled?: boolean;
  cooldownMs?: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceDetectionRef = useRef<any | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastCountRef = useRef<number>(0);
  const [running, setRunning] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || !isScriptLoaded || running) return;

    let localStream: MediaStream | null = null;

    async function start() {
      const videoEl = videoRef.current;
      if (!videoEl) return;
      
      const FaceDetection = (window as any).FaceDetection;
      if (!FaceDetection) {
        console.error("FaceDetection not available on window. This should not happen if script is loaded.");
        return;
      }

      faceDetectionRef.current = new FaceDetection({
        locateFile: (file: any) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });
      
      if (!faceDetectionRef.current) return;

      faceDetectionRef.current.setOptions({
        model: 'short',
        minDetectionConfidence: 0.6,
      });

      faceDetectionRef.current.onResults(async (results: any) => {
        const faces = results?.detections?.length || 0;
        if (faces <= 0) return;

        const now = Date.now();
        if (now - lastCountRef.current < cooldownMs) return;
        lastCountRef.current = now;
        
        const dailyStats = {
            visitors: increment(1),
            facesDetected: increment(faces),
            updatedAt: serverTimestamp(),
        };
        const eventData = {
          type: 'VISITOR_PING',
          kioskId,
          ts: serverTimestamp(),
        };

        setDoc(
          doc(db, 'kioskStatsDaily', todayKey()),
          dailyStats,
          { merge: true }
        ).catch(error => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `/kioskStatsDaily/${todayKey()}`, operation: 'update', requestResourceData: { visitors: increment(1) }
                }));
            }
        });

        addDoc(collection(db, 'kioskEvents'), eventData).catch(error => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: '/kioskEvents', operation: 'create', requestResourceData: eventData
                }));
            }
        });
      });

      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        videoEl.srcObject = localStream;
        await videoEl.play();
        setRunning(true);
        
        const processVideo = async () => {
          if (videoEl.readyState >= 2 && faceDetectionRef.current) {
            await faceDetectionRef.current.send({ image: videoEl });
          }
          animationFrameId.current = requestAnimationFrame(processVideo);
        };
        animationFrameId.current = requestAnimationFrame(processVideo);

      } catch (error) {
        console.error("Camera access denied or failed to start:", error);
        setRunning(false);
      }
    }

    start();

    return () => {
      if (!running) return;
      setRunning(false);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      try {
        faceDetectionRef.current?.close();
      } catch (e) {
          // Silently ignore close errors
      }
    };
  }, [enabled, cooldownMs, kioskId, isScriptLoaded, running]);

  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js" 
        crossOrigin="anonymous" 
        onLoad={() => setIsScriptLoaded(true)}
      />
      <div className="absolute top-3 left-3 z-50 h-24 w-32 overflow-hidden rounded-md border-2 border-white/20 bg-black shadow-lg">
        <video 
          ref={videoRef} 
          className="h-full w-full object-cover" 
          playsInline 
          autoPlay 
          muted 
        />
         {!running && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-xs">
                Kamera nonaktif
            </div>
        )}
      </div>
    </>
  );
}
