import type { TouchType } from '../types/yugal';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtor();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {
      // Audio playback requires user gesture; fail silently.
    });
  }
  return sharedAudioCtx;
}

function playLowThump(
  ctx: AudioContext,
  startTime: number,
  durationSec: number,
  peakFreq: number,
  endFreq: number,
  gainAmount: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(peakFreq, startTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(24, endFreq), startTime + durationSec);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(gainAmount, startTime + Math.min(0.04, durationSec * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + durationSec + 0.02);
}

/**
 * Triggers a refined physical vibration (where browser supports navigator.vibrate)
 * and optional low-frequency LRA acoustic resonance simulating Yugal's micro-actuator.
 */
export function triggerHapticFeedback(
  type: TouchType,
  options: {
    intensity?: number;
    durationMs?: number;
    bpm?: number;
    soundEnabled?: boolean;
  } = {}
) {
  const intensity = Math.min(100, Math.max(10, options.intensity ?? 75));
  const durationMs = Math.min(6000, Math.max(150, options.durationMs ?? 1200));
  const bpm = Math.min(180, Math.max(45, options.bpm ?? 72));
  const soundEnabled = options.soundEnabled ?? true;
  const gainScale = (intensity / 100) * 0.26;

  // Browser tactile motor fallback on supported mobile devices
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      if (type === 'heartbeat') {
        const beatGap = Math.round((60 / bpm) * 1000) - 220;
        navigator.vibrate([70, 95, 55, Math.max(200, beatGap), 70, 95, 55]);
      } else if (type === 'double_tap') {
        navigator.vibrate([55, 110, 65]);
      } else if (type === 'goodnight') {
        navigator.vibrate([160, 180, 120, 220, 80]);
      } else if (type === 'warm_pulse') {
        navigator.vibrate([220, 120, 280]);
      } else {
        navigator.vibrate([Math.min(600, Math.round(durationMs * 0.45))]);
      }
    } catch {
      // Ignore unsupported vibration environments
    }
  }

  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + 0.01;

  if (type === 'heartbeat') {
    const cycleSec = 60 / bpm;
    for (let i = 0; i < 3; i++) {
      const base = now + i * cycleSec;
      // Lub
      playLowThump(ctx, base, 0.14, 78, 38, gainScale);
      // Dub
      playLowThump(ctx, base + 0.19, 0.12, 64, 34, gainScale * 0.72);
    }
  } else if (type === 'double_tap') {
    playLowThump(ctx, now, 0.09, 130, 56, gainScale * 0.9);
    playLowThump(ctx, now + 0.19, 0.11, 142, 58, gainScale);
  } else if (type === 'goodnight') {
    playLowThump(ctx, now, 0.42, 92, 46, gainScale * 0.78);
    playLowThump(ctx, now + 0.56, 0.48, 82, 42, gainScale * 0.58);
    playLowThump(ctx, now + 1.18, 0.58, 72, 36, gainScale * 0.36);
  } else if (type === 'warm_pulse') {
    playLowThump(ctx, now, 0.52, 88, 52, gainScale * 0.8);
    playLowThump(ctx, now + 0.62, 0.65, 96, 48, gainScale * 0.9);
  } else {
    // Gentle squeeze: smooth sustained low resonant envelope
    const durSec = Math.min(2.2, Math.max(0.35, durationMs / 1000));
    playLowThump(ctx, now, durSec, 94, 52, gainScale * 0.95);
  }
}
