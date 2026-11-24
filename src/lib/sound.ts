let ctx: AudioContext | null = null;

/** iOS kräver att ljud låses upp av en användarhandling. */
export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch { /* inget ljud */ }
}

export function beep(times = 3) {
  if (!ctx) return;
  for (let i = 0; i < times; i++) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = i === times - 1 ? 1320 : 880;
    const t0 = ctx.currentTime + i * 0.25;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    o.connect(g).connect(ctx.destination);
    o.start(t0); o.stop(t0 + 0.2);
  }
}

export const vibrate = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch { /* ej stöd */ } };
