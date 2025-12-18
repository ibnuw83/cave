
'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceDetection } from '@mediapipe/face_detection';
import { doc, increment, serverTimestamp, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';


function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
  const animationFrameId = useRef<number | null>(null);
  const faceDetectionRef = useRef<FaceDetection | null>(null);
  const lastCountRef = useRef<number>(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let localStream: MediaStream | null = null;

    async function start() {
      const videoEl = videoRef.current;
      if (!videoEl) return;

      const faceDetection = new (window as any).FaceDetection({
        locateFile: (file: any) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });
      faceDetectionRef.current = faceDetection;

      faceDetection.setOptions({
        model: 'short',
        minDetectionConfidence: 0.6,
      });

      faceDetection.onResults(async (results: any) => {
        const faces = results?.detections?.length || 0;
        if (faces <= 0) return;

        const now = Date.now();
        if (now - lastCountRef.current < cooldownMs) return;
        lastCountRef.current = now;

        const dailyDoc = doc(db, 'kioskStatsDaily', todayKey());
        setDoc(
          dailyDoc,
          { updatedAt: serverTimestamp(), facesDetected: increment(faces), visitors: increment(1) },
          { merge: true }
        ).catch(error => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `/kioskStatsDaily/${todayKey()}`, operation: 'update', requestResourceData: { visitors: increment(1) }
                }));
            }
        });

        addDoc(collection(db, 'kioskEvents'), {
          type: 'VISITOR_PING', kioskId, ts: serverTimestamp()
        }).catch(error => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: '/kioskEvents', operation: 'create', requestResourceData: { type: 'VISITOR_PING' }
                }));
            }
        });
      });

      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true });
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
        console.error("Camera access denied:", error);
        setRunning(false);
      }
    }

    start();

    return () => {
      setRunning(false);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      try {
        faceDetectionRef.current?.close();
      } catch {}
    };
  }, [enabled, cooldownMs, kioskId]);

  return (
    <div className="absolute top-3 left-3 z-50">
      <video ref={videoRef} className="hidden" playsInline autoPlay muted />
      <div className="rounded-md bg-black/60 px-3 py-2 text-xs text-white">
        VisitorCounter: {running ? 'ON' : 'OFF'}
      </div>
    </div>
  );
}
