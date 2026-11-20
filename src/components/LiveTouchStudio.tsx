import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Check,
  Copy,
  Heart,
  Link2,
  Play,
  Send,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TOUCH_PATTERNS } from '../data/catalog';
import { triggerHapticFeedback } from '../lib/haptics';
import {
  createCouplePair,
  joinCouplePairByCode,
  sendRealtimeTouch,
  updatePairPresenceMood,
} from '../lib/firebase';
import {
  BLUEPRINT_LIMITS,
  MOOD_OPTIONS,
  type CouplePairRecord,
  type HapticTouchRecord,
  type MoodOption,
  type TouchType,
  type UserProfileRecord,
} from '../types/yugal';
import { HapticWaveCanvas } from './HardwareArtwork';

interface LiveTouchStudioProps {
  user: User | null;
  profile: UserProfileRecord | null;
  pair: CouplePairRecord | null;
  touches: HapticTouchRecord[];
  onSignIn: () => void;
  authBusy: boolean;
}

function formatTouchTime(touch: HapticTouchRecord): string {
  if (!touch.createdAt) return 'Just now';
  const date = touch.createdAt.toDate();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function labelForTouchType(type: TouchType): string {
  const found = TOUCH_PATTERNS.find((p) => p.type === type);
  return found ? found.label : 'Touch';
}

export function LiveTouchStudio({
  user,
  profile,
  pair,
  touches,
  onSignIn,
  authBusy,
}: LiveTouchStudioProps) {
  const [selectedType, setSelectedType] = useState<TouchType>('squeeze');
  const [bpm, setBpm] = useState(72);
  const [intensity, setIntensity] = useState(78);
  const [note, setNote] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Press-and-hold squeeze gesture state
  const [isPressing, setIsPressing] = useState(false);
  const [pressDurationMs, setPressDurationMs] = useState(0);
  const pressStartRef = useRef<number | null>(null);
  const pressTimerRef = useRef<number | null>(null);

  // Tap-to-measure BPM state
  const tapTimesRef = useRef<number[]>([]);

  // Local preview feed (for visitors trying before signing in)
  const [previewTouches, setPreviewTouches] = useState<
    {
      id: string;
      senderName: string;
      type: TouchType;
      intensity: number;
      durationMs: number;
      bpm: number;
      note: string;
      timeLabel: string;
    }[]
  >([]);

  const [triggerNonce, setTriggerNonce] = useState(0);
  const [sending, setSending] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Partner pairing controls
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [pairActionBusy, setPairActionBusy] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);
  const [copiedPairCode, setCopiedPairCode] = useState(false);

  // Play incoming real-time partner touches automatically
  const lastSeenTouchIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (touches.length === 0) return;
    const latest = touches[0];
    if (lastSeenTouchIdRef.current === null) {
      lastSeenTouchIdRef.current = latest.id;
      return;
    }
    if (latest.id !== lastSeenTouchIdRef.current) {
      lastSeenTouchIdRef.current = latest.id;
      if (user && latest.senderId !== user.uid) {
        setTriggerNonce((n) => n + 1);
        triggerHapticFeedback(latest.type, {
          intensity: latest.intensity,
          durationMs: latest.durationMs,
          bpm: latest.bpm || 72,
          soundEnabled,
        });
        setFeedbackBanner(
          `Received ${labelForTouchType(latest.type)} from ${latest.senderName}`
        );
      }
    }
  }, [touches, user, soundEnabled]);

  useEffect(() => {
    if (!feedbackBanner) return;
    const timer = window.setTimeout(() => setFeedbackBanner(null), 4000);
    return () => window.clearTimeout(timer);
  }, [feedbackBanner]);

  const currentMood: MoodOption = pair && user
    ? pair.ownerId === user.uid
      ? pair.ownerMood
      : pair.partnerMood
    : profile?.mood || 'Calm';

  const partnerConnected = Boolean(pair && pair.status === 'paired' && pair.partnerId);
  const partnerDisplayName =
    pair && user
      ? pair.ownerId === user.uid
        ? pair.partnerName || 'Waiting for partner'
        : pair.ownerName
      : 'Preview Partner';
  const partnerMood: MoodOption | null =
    pair && user && partnerConnected
      ? pair.ownerId === user.uid
        ? pair.partnerMood
        : pair.ownerMood
      : null;

  async function dispatchTouch(overrides?: {
    type?: TouchType;
    durationMs?: number;
    intensity?: number;
    bpm?: number;
  }) {
    const type = overrides?.type ?? selectedType;
    const pattern = TOUCH_PATTERNS.find((p) => p.type === type) ?? TOUCH_PATTERNS[0];
    const finalDuration = overrides?.durationMs ?? pattern.defaultDurationMs;
    const finalIntensity = overrides?.intensity ?? intensity;
    const finalBpm = type === 'heartbeat' ? (overrides?.bpm ?? bpm) : 0;

    setTriggerNonce((n) => n + 1);
    triggerHapticFeedback(type, {
      intensity: finalIntensity,
      durationMs: finalDuration,
      bpm: finalBpm || 72,
      soundEnabled,
    });

    if (user && pair && pair.status !== 'archived') {
      setSending(true);
      try {
        await sendRealtimeTouch(pair, user, {
          type,
          intensity: finalIntensity,
          durationMs: finalDuration,
          bpm: finalBpm,
          note,
        });
        setNote('');
        setFeedbackBanner(
          partnerConnected
            ? `${pattern.label} synced to ${partnerDisplayName} in real time`
            : `${pattern.label} saved to your live pair channel`
        );
      } finally {
        setSending(false);
      }
    } else {
      setPreviewTouches((prev) => [
        {
          id: `local_${Date.now()}`,
          senderName: user?.displayName?.split(' ')[0] || 'You (Preview)',
          type,
          intensity: finalIntensity,
          durationMs: finalDuration,
          bpm: finalBpm,
          note: note.trim().slice(0, BLUEPRINT_LIMITS.NOTE_MAX),
          timeLabel: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...prev.slice(0, 9),
      ]);
      setNote('');
      setFeedbackBanner(
        user
          ? `${pattern.label} tested — create or join a Pair Channel below to sync across devices`
          : `${pattern.label} previewed — sign in with Google to sync live with your partner`
      );
    }
  }

  function handleSqueezeStart() {
    if (isPressing) return;
    setSelectedType('squeeze');
    setIsPressing(true);
    setPressDurationMs(150);
    pressStartRef.current = performance.now();
    pressTimerRef.current = window.setInterval(() => {
      if (pressStartRef.current !== null) {
        const elapsed = Math.min(4000, Math.round(performance.now() - pressStartRef.current));
        setPressDurationMs(elapsed);
        const dynamicIntensity = Math.min(100, Math.max(45, Math.round(45 + (elapsed / 4000) * 55)));
        setIntensity(dynamicIntensity);
      }
    }, 50);
  }

  function handleSqueezeEnd() {
    if (!isPressing) return;
    setIsPressing(false);
    if (pressTimerRef.current !== null) {
      window.clearInterval(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    const elapsed =
      pressStartRef.current !== null
        ? Math.min(4000, Math.max(350, Math.round(performance.now() - pressStartRef.current)))
        : 1200;
    pressStartRef.current = null;
    const computedIntensity = Math.min(100, Math.max(50, Math.round(50 + (elapsed / 4000) * 50)));
    setPressDurationMs(0);
    void dispatchTouch({
      type: 'squeeze',
      durationMs: elapsed,
      intensity: computedIntensity,
    });
  }

  function handleTapHeartbeatBpm() {
    const now = performance.now();
    const recent = tapTimesRef.current.filter((t) => now - t < 4000);
    recent.push(now);
    tapTimesRef.current = recent;
    setSelectedType('heartbeat');
    triggerHapticFeedback('double_tap', { intensity: 45, durationMs: 200, soundEnabled });
    if (recent.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < recent.length; i++) {
        gaps.push(recent[i] - recent[i - 1]);
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const estimatedBpm = Math.round(60000 / avgGap);
      setBpm(Math.min(140, Math.max(48, estimatedBpm)));
    }
  }

  async function handleCreatePair() {
    if (!user) {
      onSignIn();
      return;
    }
    setPairActionBusy(true);
    setPairError(null);
    try {
      await createCouplePair(user, profile?.displayName || user.displayName || 'You', currentMood);
    } catch (err) {
      setPairError(err instanceof Error ? err.message : 'Unable to create pair channel.');
    } finally {
      setPairActionBusy(false);
    }
  }

  async function handleJoinPair(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      onSignIn();
      return;
    }
    setPairActionBusy(true);
    setPairError(null);
    try {
      const res = await joinCouplePairByCode(
        user,
        joinCodeInput,
        profile?.displayName || user.displayName || 'Partner',
        currentMood
      );
      if (!res.ok) {
        setPairError(res.reason);
      } else {
        setJoinCodeInput('');
      }
    } catch (err) {
      setPairError(err instanceof Error ? err.message : 'Unable to join pair channel.');
    } finally {
      setPairActionBusy(false);
    }
  }

  async function handleMoodSelect(mood: MoodOption) {
    if (!user || !pair) return;
    await updatePairPresenceMood(pair, user, mood);
  }

  function handleCopyPairCode() {
    if (!pair) return;
    navigator.clipboard.writeText(pair.pairCode).catch(() => {});
    setCopiedPairCode(true);
    window.setTimeout(() => setCopiedPairCode(false), 2000);
  }

  const displayedFeed =
    user && pair
      ? touches.map((t) => ({
          id: t.id,
          senderName: t.senderId === user.uid ? 'You' : t.senderName,
          isSelf: t.senderId === user.uid,
          type: t.type,
          intensity: t.intensity,
          durationMs: t.durationMs,
          bpm: t.bpm,
          note: t.note,
          timeLabel: formatTouchTime(t),
        }))
      : previewTouches.map((t) => ({ ...t, isSelf: true }));

  return (
    <section
      id="live-touch"
      className="py-24 bg-[#141518] text-[#F8F8FA] border-y border-[#23252C]"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-12 border-b border-white/10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.14em] text-[#E0485E] mb-3">
              Live Companion Studio
            </p>
            <h2 className="font-editorial text-4xl sm:text-5xl font-medium tracking-tight text-white">
              Experience real-time haptic touch and heartbeat sync
            </h2>
            <p className="mt-4 text-[15px] text-white/70 leading-relaxed">
              Press and hold the ring pad to send a gentle squeeze, or set your cardiac cadence to
              transmit a live heartbeat. Sign in with Google to pair with your partner over
              real-time cloud sync.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white/85 bg-white/5 border border-white/15 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#E0485E]" />
              ) : (
                <VolumeX className="w-4 h-4 text-white/50" />
              )}
              <span>{soundEnabled ? 'Acoustic LRA Audio On' : 'Audio Muted'}</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Interactive Studio */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left 7 Cols: Interactive Transducer & Controls */}
          <div className="lg:col-span-7 space-y-8">
            {/* Pattern Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              {TOUCH_PATTERNS.map((pattern) => {
                const active = selectedType === pattern.type;
                return (
                  <button
                    key={pattern.type}
                    type="button"
                    onClick={() => {
                      setSelectedType(pattern.type);
                      setIntensity(pattern.defaultIntensity);
                    }}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-white text-[#141518] border-white'
                        : 'bg-transparent text-white/75 border-white/15 hover:border-white/35 hover:text-white'
                    }`}
                  >
                    {pattern.label}
                  </button>
                );
              })}
            </div>

            {/* Waveform & Squeeze Ring Pad Surface */}
            <div className="bg-[#1B1D22] border border-white/10 rounded-xl p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 text-xs text-white/60 mb-4">
                <span>
                  {labelForTouchType(selectedType)}
                  <span aria-hidden="true" className="mx-2">
                    ·
                  </span>
                  <span className="font-technical">
                    {selectedType === 'heartbeat' ? `${bpm} BPM` : `${intensity}% pressure`}
                  </span>
                </span>
                <span className="font-technical text-white/50">
                  {isPressing ? `${(pressDurationMs / 1000).toFixed(1)}s hold` : 'Micro-LRA ready'}
                </span>
              </div>

              <HapticWaveCanvas
                activeType={selectedType}
                bpm={bpm}
                intensity={intensity}
                isPressing={isPressing}
                triggerNonce={triggerNonce}
              />

              {/* Primary Tactile Interaction Area */}
              <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                {selectedType === 'squeeze' ? (
                  <div className="flex items-center gap-5 w-full sm:w-auto">
                    <button
                      type="button"
                      onPointerDown={handleSqueezeStart}
                      onPointerUp={handleSqueezeEnd}
                      onPointerLeave={() => {
                        if (isPressing) handleSqueezeEnd();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          void dispatchTouch({ type: 'squeeze', durationMs: 1600, intensity });
                        }
                      }}
                      className={`w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center transition-transform select-none touch-none shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E0485E] ${
                        isPressing
                          ? 'bg-[#B8293D] border-[#E0485E] scale-95 text-white'
                          : 'bg-[#24272F] border-white/25 hover:border-[#E0485E] text-white'
                      }`}
                    >
                      <span className="text-xs font-semibold tracking-wide">
                        {isPressing ? 'Holding' : 'Hold'}
                      </span>
                      <span className="font-technical text-[11px] text-white/75 mt-0.5">
                        {isPressing ? `${(pressDurationMs / 1000).toFixed(1)}s` : 'Squeeze'}
                      </span>
                    </button>
                    <div className="text-sm text-white/75 leading-relaxed">
                      <p className="font-medium text-white">Press & hold to modulate squeeze</p>
                      <p className="text-xs text-white/55 mt-1">
                        Hold longer for deeper reassuring pressure, then release to transmit.
                      </p>
                    </div>
                  </div>
                ) : selectedType === 'heartbeat' ? (
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <label htmlFor="bpm-range" className="text-xs font-medium text-white/80">
                        Cardiac Rhythm Cadence
                      </label>
                      <button
                        type="button"
                        onClick={handleTapHeartbeatBpm}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/15 text-white rounded-md transition-colors whitespace-nowrap shrink-0"
                      >
                        <Heart className="w-3.5 h-3.5 text-[#E0485E]" />
                        <span>Tap to measure BPM</span>
                      </button>
                    </div>
                    <input
                      id="bpm-range"
                      type="range"
                      min={48}
                      max={140}
                      value={bpm}
                      onChange={(e) => setBpm(Number(e.target.value))}
                      className="w-full accent-[#B8293D]"
                    />
                    <div className="flex justify-between font-technical text-[11px] text-white/45">
                      <span>48 BPM Resting</span>
                      <span className="text-white font-medium">{bpm} BPM Selected</span>
                      <span>140 BPM Active</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-white/75 leading-relaxed">
                    <p className="font-medium text-white">{labelForTouchType(selectedType)}</p>
                    <p className="text-xs text-white/55 mt-1">
                      {TOUCH_PATTERNS.find((p) => p.type === selectedType)?.shortDesc}
                    </p>
                  </div>
                )}

                {selectedType !== 'squeeze' && (
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => void dispatchTouch()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#B8293D] hover:bg-[#9B2031] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 w-full sm:w-auto"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sending ? 'Syncing...' : 'Send Sensation'}</span>
                  </button>
                )}
              </div>

              {/* Optional Whisper Note */}
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.NOTE_MAX}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional quiet note attached to your touch (e.g., Landed safely in Mumbai)"
                  className="flex-1 bg-[#141518] border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-white/45"
                />
                {selectedType === 'squeeze' && (
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() =>
                      void dispatchTouch({ type: 'squeeze', durationMs: 1800, intensity })
                    }
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#B8293D] hover:bg-[#9B2031] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sending ? 'Syncing...' : 'Send Squeeze'}</span>
                  </button>
                )}
              </div>

              {feedbackBanner && (
                <p
                  role="status"
                  className="mt-4 text-xs text-white/85 bg-white/5 border border-white/10 rounded-lg px-3.5 py-2"
                >
                  {feedbackBanner}
                </p>
              )}
            </div>
          </div>

          {/* Right 5 Cols: Partner Pairing & Real-Time Touch Stream */}
          <div className="lg:col-span-5 space-y-6">
            {/* Partner Channel Panel */}
            <div className="bg-[#1B1D22] border border-white/10 rounded-xl p-6">
              {!user ? (
                <div>
                  <p className="text-xs font-medium text-[#E0485E] mb-2">
                    Real-Time Partner Sync
                  </p>
                  <h3 className="font-editorial text-2xl font-medium text-white">
                    Link two wearables or accounts
                  </h3>
                  <p className="mt-2 text-sm text-white/65 leading-relaxed">
                    Sign in with Google to generate a private 8-character Pair Code, sync emotional
                    moods, and exchange live haptic touches across devices.
                  </p>
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={onSignIn}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#141518] bg-white hover:bg-[#F0F1F4] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <span>{authBusy ? 'Signing in...' : 'Sign in with Google to Pair'}</span>
                  </button>
                </div>
              ) : !pair ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium text-[#E0485E] mb-1.5">
                      Pair Your Channel
                    </p>
                    <h3 className="font-editorial text-2xl font-medium text-white">
                      Connect with your partner
                    </h3>
                    <p className="mt-1.5 text-xs text-white/60 leading-relaxed">
                      Start a new encrypted pair room or join with your partner’s 8-character code.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={pairActionBusy}
                    onClick={() => void handleCreatePair()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#B8293D] hover:bg-[#9B2031] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Link2 className="w-4 h-4" />
                    <span>{pairActionBusy ? 'Creating channel...' : 'Create New Pair Code'}</span>
                  </button>

                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-white/10" />
                    <span className="px-3 text-xs text-white/40">or join existing</span>
                    <div className="flex-grow border-t border-white/10" />
                  </div>

                  <form onSubmit={(e) => void handleJoinPair(e)} className="flex gap-2">
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="Enter 8-char code"
                      maxLength={12}
                      className="flex-1 bg-[#141518] border border-white/15 rounded-lg px-3.5 py-2 font-technical text-sm uppercase tracking-wider text-white placeholder:text-white/35 focus:outline-none focus:border-white/45"
                    />
                    <button
                      type="submit"
                      disabled={pairActionBusy || joinCodeInput.trim().length < 6}
                      className="px-4 py-2 text-sm font-medium bg-white text-[#141518] hover:bg-[#F0F1F4] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      Join
                    </button>
                  </form>

                  {pairError && (
                    <p role="alert" className="text-xs text-[#F28B99]">
                      {pairError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-white/55">
                        {partnerConnected ? 'Paired Live' : 'Open Pair Channel'}
                        <span aria-hidden="true" className="mx-1.5">
                          ·
                        </span>
                        <span className="font-technical">{pair.touchCount} touches synced</span>
                      </p>
                      <h3 className="font-editorial text-2xl font-medium text-white mt-1">
                        {partnerConnected ? partnerDisplayName : 'Share code with partner'}
                      </h3>
                      {partnerMood && (
                        <p className="text-xs text-white/65 mt-1">
                          Partner mood: <span className="text-white">{partnerMood}</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPairCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141518] border border-white/15 rounded-lg font-technical text-xs text-white hover:border-white/40 transition-colors whitespace-nowrap shrink-0"
                      title="Copy Pair Code"
                    >
                      <span>{pair.pairCode}</span>
                      {copiedPairCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white/60" />
                      )}
                    </button>
                  </div>

                  {/* Emotional Presence Mood Selector */}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-white/55 mb-2.5">Your emotional presence</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MOOD_OPTIONS.map((mood) => {
                        const isSelected = currentMood === mood;
                        return (
                          <button
                            key={mood}
                            type="button"
                            onClick={() => void handleMoodSelect(mood)}
                            className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors whitespace-nowrap ${
                              isSelected
                                ? 'bg-[#B8293D] border-[#B8293D] text-white font-medium'
                                : 'bg-transparent border-white/15 text-white/70 hover:text-white hover:border-white/35'
                            }`}
                          >
                            {mood}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chronological Touch History */}
            <div className="bg-[#1B1D22] border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white">Recent Tactile Stream</h3>
                <span className="font-technical text-xs text-white/45">
                  {displayedFeed.length} events
                </span>
              </div>

              {displayedFeed.length === 0 ? (
                <p className="text-xs text-white/50 py-6 leading-relaxed">
                  No touches recorded yet. Press and hold the Squeeze ring or send a Heartbeat
                  rhythm to see real-time tactile history appear here.
                </p>
              ) : (
                <ul className="divide-y divide-white/10 max-h-[290px] overflow-y-auto pr-1">
                  {displayedFeed.slice(0, 8).map((item) => (
                    <li
                      key={item.id}
                      className="py-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <span className="font-medium text-white">{item.senderName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{labelForTouchType(item.type)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-technical">{item.timeLabel}</span>
                        </div>
                        <p className="font-technical text-[11px] text-white/45 mt-1">
                          {item.type === 'heartbeat'
                            ? `${item.bpm} BPM cadence`
                            : `${(item.durationMs / 1000).toFixed(1)}s · ${item.intensity}% pressure`}
                        </p>
                        {item.note && (
                          <p className="text-xs text-white/80 mt-1 break-words">“{item.note}”</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedType(item.type);
                          if (item.bpm > 0) setBpm(item.bpm);
                          setTriggerNonce((n) => n + 1);
                          triggerHapticFeedback(item.type, {
                            intensity: item.intensity,
                            durationMs: item.durationMs,
                            bpm: item.bpm || 72,
                            soundEnabled,
                          });
                        }}
                        aria-label={`Replay ${labelForTouchType(item.type)}`}
                        className="p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors shrink-0"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
