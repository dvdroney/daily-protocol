import { useState, useRef, useCallback, useEffect } from 'react';

let lastVibrateTime = 0;
let audioCtx = null;

function vibrate(pattern) {
  const now = Date.now();
  if (now - lastVibrateTime < 100) return;
  lastVibrateTime = now;
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  } else {
    playChime();
  }
}

function getAudioContext() {
  if (!audioCtx || audioCtx.state === 'closed') {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playChime(frequency = 800, duration = 200) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frequency;
    gain.gain.value = 0.3;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => { osc.stop(); osc.disconnect(); gain.disconnect(); }, duration);
  } catch {
    // Audio not available
  }
}

export function useTimer(timerType, config = {}) {
  const { sets = 1, holdSeconds = 0, restSeconds = 0, timerSeconds = 0 } = config;

  const [state, setState] = useState({
    isRunning: false,
    currentSet: 1,
    phase: 'idle', // idle | hold | rest | countdown | complete
    secondsRemaining: 0,
    elapsedSeconds: 0,
  });

  const intervalRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const tick = useCallback(() => {
    const s = stateRef.current;

    if (timerType === 'stopwatch') {
      setState(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
      return;
    }

    if (s.secondsRemaining <= 1) {
      // Phase transition
      if (timerType === 'countdown' || s.phase === 'countdown') {
        vibrate([200, 100, 200, 100, 200]);
        clearTimer();
        setState(prev => ({ ...prev, isRunning: false, secondsRemaining: 0, phase: 'complete' }));
        return;
      }

      if (s.phase === 'hold') {
        if (s.currentSet >= sets && restSeconds === 0) {
          vibrate([200, 100, 200, 100, 200]);
          clearTimer();
          setState(prev => ({ ...prev, isRunning: false, secondsRemaining: 0, phase: 'complete' }));
          return;
        }
        if (restSeconds > 0) {
          vibrate([200, 100, 200]);
          setState(prev => ({ ...prev, phase: 'rest', secondsRemaining: restSeconds }));
        } else {
          vibrate([150]);
          setState(prev => ({
            ...prev,
            currentSet: prev.currentSet + 1,
            phase: 'hold',
            secondsRemaining: holdSeconds,
          }));
        }
        return;
      }

      if (s.phase === 'rest') {
        if (s.currentSet >= sets) {
          vibrate([200, 100, 200, 100, 200]);
          clearTimer();
          setState(prev => ({ ...prev, isRunning: false, secondsRemaining: 0, phase: 'complete' }));
          return;
        }
        vibrate([150]);
        setState(prev => ({
          ...prev,
          currentSet: prev.currentSet + 1,
          phase: 'hold',
          secondsRemaining: holdSeconds,
        }));
        return;
      }
    }

    setState(prev => ({ ...prev, secondsRemaining: prev.secondsRemaining - 1 }));
  }, [timerType, sets, holdSeconds, restSeconds, clearTimer]);

  const start = useCallback(() => {
    clearTimer();
    let initial;
    if (timerType === 'interval') {
      initial = { isRunning: true, currentSet: 1, phase: 'hold', secondsRemaining: holdSeconds, elapsedSeconds: 0 };
    } else if (timerType === 'countdown') {
      initial = { isRunning: true, currentSet: 1, phase: 'countdown', secondsRemaining: timerSeconds, elapsedSeconds: 0 };
    } else {
      initial = { isRunning: true, currentSet: 1, phase: 'idle', secondsRemaining: 0, elapsedSeconds: 0 };
    }
    setState(initial);
    intervalRef.current = setInterval(tick, 1000);
  }, [timerType, holdSeconds, timerSeconds, tick, clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setState(prev => ({ ...prev, isRunning: false }));
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (!state.isRunning && state.phase !== 'idle' && state.phase !== 'complete') {
      intervalRef.current = setInterval(tick, 1000);
      setState(prev => ({ ...prev, isRunning: true }));
    }
  }, [state.isRunning, state.phase, tick]);

  const reset = useCallback(() => {
    clearTimer();
    setState({ isRunning: false, currentSet: 1, phase: 'idle', secondsRemaining: 0, elapsedSeconds: 0 });
  }, [clearTimer]);

  const skipToNextSet = useCallback(() => {
    if (timerType !== 'interval') return;
    const s = stateRef.current;
    if (s.currentSet >= sets) {
      vibrate([200, 100, 200, 100, 200]);
      clearTimer();
      setState(prev => ({ ...prev, isRunning: false, secondsRemaining: 0, phase: 'complete' }));
      return;
    }
    vibrate([150]);
    setState(prev => ({
      ...prev,
      currentSet: prev.currentSet + 1,
      phase: 'hold',
      secondsRemaining: holdSeconds,
    }));
  }, [timerType, sets, holdSeconds, clearTimer]);

  return { ...state, totalSets: sets, start, pause, resume, reset, skipToNextSet };
}
