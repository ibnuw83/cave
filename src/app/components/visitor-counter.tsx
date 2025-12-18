'use client';

import { useEffect, useRef, useState } from 'react';
import { FaceDetection } from '@mediapipe/face_detection';
import * as cameraUtils from '@mediapipe/camera_utils';
import { doc, increment, serverTimestamp, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  const cameraRef = useRef<cameraUtils.Camera | null>(null);
  const lastCountRef = useRef<number>(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let faceDetection: FaceDetection | null = null;

    async function start() {
      if (!videoRef.current) return;

      faceDetection = new FaceDetection({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });

      faceDetection.setOptions({
        model: 'short',
        minDetectionConfidence: 0.6,
      });

      faceDetection.onResults(async (results) => {
        const faces = results?.detections?.length || 0;
        if (faces <= 0) return;

        const now = Date.now();
        if (now - lastCountRef.current < cooldownMs) return;
        lastCountRef.current = now;

        // 1) agregasi harian (aman, anonim)
        const dailyDoc = doc(db, 'kioskStatsDaily', todayKey());
        setDoc(
          dailyDoc,
          {
            updatedAt: serverTimestamp(),
            facesDetected: increment(faces),
            visitors: increment(1),
          },
          { merge: true }
        ).catch(err => console.error("Firestore error (daily stats):", err));

        // 2) event log (opsional)
        addDoc(collection(db, 'kioskEvents'), {
          type: 'VISITOR_PING',
          kioskId,
          ts: serverTimestamp(),
        }).catch(err => console.error("Firestore error (event log):", err));
      });

      // Ensure camera access is requested
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera access denied:", error);
        // Optionally, you could set a state to show a message to the user
        return;
      }


      cameraRef.current = new cameraUtils.Camera(videoRef.current, {
        onFrame: async () => {
          if (!faceDetection || !videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
          try {
             await faceDetection.send({ image: videoRef.current });
          } catch(e) {
            console.error("Face detection send failed:", e);
          }
        },
        width: 640,
        height: 360,
      });

      await cameraRef.current.start();
      setRunning(true);
    }

    start().catch(console.error);

    return () => {
      setRunning(false);
      try {
        cameraRef.current?.stop();
        const stream = videoRef.current?.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      } catch {}
      faceDetection?.close?.();
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
