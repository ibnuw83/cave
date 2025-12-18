'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Spot } from '@/lib/types';

export type KioskMode = 'loop' | 'shuffle';

type PlayerState = {
  index: number;
  isPlaying: boolean;
  isMuted: boolean;
  secondsLeft: number;
};

function shuffleIndices(n: number) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useKioskPlayer(params: {
  spots: Spot[];
  mode: KioskMode;
  defaultDurationSec?: number;
  getDurationSec?: (spot: Spot) => number | undefined;
  autoplay?: boolean;
}) {
  const {
    spots,
    mode,
    defaultDurationSec = 30,
    getDurationSec,
    autoplay = true,
  } = params;

  const [state, setState] = useState<PlayerState>({
    index: 0,
    isPlaying: autoplay,
    isMuted: true,
    secondsLeft: defaultDurationSec,
  });

  const orderRef = useRef<number[]>([]);
  const timerRef = useRef<number | null>(null);

  const orderedSpots = useMemo(() => {
    const n = spots.length;
    if (n === 0) return [];
    if (mode === 'loop') return spots;

    // shuffle but stable until spots change
    if (orderRef.current.length !== n) orderRef.current = shuffleIndices(n);
    return orderRef.current.map(i => spots[i]);
  }, [spots, mode]);

  const currentSpot = orderedSpots[state.index] ?? null;

  const durationForCurrent = useMemo(() => {
    if (!currentSpot) return defaultDurationSec;
    const d = getDurationSec?.(currentSpot);
    return typeof d === 'number' && d > 0 ? d : defaultDurationSec;
  }, [currentSpot, defaultDurationSec, getDurationSec]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setState(s => ({ ...s, secondsLeft: durationForCurrent }));

    timerRef.current = window.setInterval(() => {
      setState(s => {
        if (!s.isPlaying) return s;
        const next = s.secondsLeft - 1;
        return { ...s, secondsLeft: next >= 0 ? next : 0 };
      });
    }, 1000);
  }, [durationForCurrent, stopTimer]);

  const goNext = useCallback(() => {
    setState(s => {
      const n = orderedSpots.length;
      if (n === 0) return s;
      const nextIndex = (s.index + 1) % n;
      return { ...s, index: nextIndex, secondsLeft: durationForCurrent };
    });
  }, [orderedSpots.length, durationForCurrent]);

  const goPrev = useCallback(() => {
    setState(s => {
      const n = orderedSpots.length;
      if (n === 0) return s;
      const prevIndex = (s.index - 1 + n) % n;
      return { ...s, index: prevIndex, secondsLeft: durationForCurrent };
    });
  }, [orderedSpots.length, durationForCurrent]);

  const setIndex = useCallback((index: number) => {
    setState(s => ({ ...s, index, secondsLeft: durationForCurrent }));
  }, [durationForCurrent]);

  const play = useCallback(() => setState(s => ({ ...s, isPlaying: true })), []);
  const pause = useCallback(() => setState(s => ({ ...s, isPlaying: false })), []);
  const toggleMute = useCallback(() => setState(s => ({ ...s, isMuted: !s.isMuted })), []);

  // reset order when spots list changes
  useEffect(() => {
    orderRef.current = [];
    setState(s => ({
      ...s,
      index: 0,
      secondsLeft: defaultDurationSec,
    }));
  }, [spots, defaultDurationSec]);

  // start timer on current spot change / play state
  useEffect(() => {
    stopTimer();
    if (!currentSpot) return;
    if (state.isPlaying) startTimer();
    return stopTimer;
  }, [currentSpot, state.isPlaying, startTimer, stopTimer]);

  // when secondsLeft hits 0 => next
  useEffect(() => {
    if (!state.isPlaying) return;
    if (!currentSpot) return;
    if (state.secondsLeft <= 0) goNext();
  }, [state.secondsLeft, state.isPlaying, currentSpot, goNext]);

  // clean
  useEffect(() => stopTimer, [stopTimer]);

  return {
    orderedSpots,
    currentSpot,
    state,
    durationForCurrent,
    actions: { play, pause, goNext, goPrev, setIndex, toggleMute },
  };
}
