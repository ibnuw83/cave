'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Options = {
  idleMs?: number;          // waktu diam sebelum auto-rotate aktif
  resumeDelayMs?: number;   // jeda setelah interaksi sebelum boleh auto lagi
};

export function useIdleAutoRotate(options: Options = {}) {
  const idleMs = options.idleMs ?? 2500;
  const resumeDelayMs = options.resumeDelayMs ?? 800;

  const [isIdle, setIsIdle] = useState(false);

  const idleTimer = useRef<number | null>(null);
  const resumeTimer = useRef<number | null>(null);

  const clearTimers = () => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    idleTimer.current = null;
    resumeTimer.current = null;
  };

  const markActive = useCallback(() => {
    // user lagi interaksi → stop auto rotate
    setIsIdle(false);
    clearTimers();

    // tunggu sebentar setelah interaksi berhenti baru mulai hitung idle lagi
    resumeTimer.current = window.setTimeout(() => {
      idleTimer.current = window.setTimeout(() => setIsIdle(true), idleMs);
    }, resumeDelayMs);
  }, [idleMs, resumeDelayMs]);

  const markIdleNow = useCallback(() => {
    clearTimers();
    setIsIdle(true);
  }, []);

  useEffect(() => {
    // start initial idle countdown
    idleTimer.current = window.setTimeout(() => setIsIdle(true), idleMs);
    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleMs]);

  return { isIdle, markActive, markIdleNow };
}
