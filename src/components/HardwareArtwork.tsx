import { useEffect, useRef } from 'react';
import type { HardwareFinish, ProductId, TouchType } from '../types/yugal';

interface HardwareSculptureProps {
  productId: ProductId;
  finish: HardwareFinish;
  engraving?: string;
  pulseActive?: boolean;
  className?: string;
}

/**
 * Architectural studio SVG sculpture of Yugal Halo Smart Ring Pair or Yugal Band Bracelet Pair.
 * Adapts material gradients live between Obsidian Ceramic and Brushed Titanium Steel.
 */
export function HardwareSculpture({
  productId,
  finish,
  engraving = '',
  pulseActive = false,
  className = '',
}: HardwareSculptureProps) {
  const isCeramic = finish === 'Obsidian Ceramic';
  const idPrefix = `${productId}-${isCeramic ? 'cer' : 'ti'}`;

  const primaryStart = isCeramic ? '#333640' : '#E9ECF2';
  const primaryMid = isCeramic ? '#16181D' : '#AEB5C2';
  const primaryEnd = isCeramic ? '#262932' : '#737B8A';
  const innerRim = isCeramic ? '#4C505E' : '#F6F7FA';
  const specular = isCeramic ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.75)';

  return (
    <div className={`relative w-full h-full flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 560 400"
        className="w-full h-full max-w-[540px]"
        role="img"
        aria-label={`${productId === 'yugal-halo-pair' ? 'Yugal Halo Smart Ring Pair' : 'Yugal Band Bracelet Pair'} in ${finish}`}
      >
        <defs>
          <linearGradient id={`${idPrefix}-metal`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryStart} />
            <stop offset="48%" stopColor={primaryMid} />
            <stop offset="100%" stopColor={primaryEnd} />
          </linearGradient>
          <linearGradient id={`${idPrefix}-metal-alt`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={primaryEnd} />
            <stop offset="50%" stopColor={primaryStart} />
            <stop offset="100%" stopColor={primaryMid} />
          </linearGradient>
          <radialGradient id={`${idPrefix}-shadow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#141518" stopOpacity="0.22" />
            <stop offset="70%" stopColor="#141518" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#141518" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${idPrefix}-pulse`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#B8293D" stopOpacity={pulseActive ? '0.28' : '0.09'} />
            <stop offset="100%" stopColor="#B8293D" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Subtle tactile acoustic rings */}
        <circle
          cx="280"
          cy="195"
          r={pulseActive ? 168 : 148}
          fill={`url(#${idPrefix}-pulse)`}
          style={{ transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        <circle
          cx="280"
          cy="195"
          r="118"
          fill="none"
          stroke="#B8293D"
          strokeOpacity={pulseActive ? '0.38' : '0.12'}
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        <circle
          cx="280"
          cy="195"
          r="158"
          fill="none"
          stroke="#141518"
          strokeOpacity="0.06"
          strokeWidth="1"
        />

        {/* Ground contact shadow */}
        <ellipse cx="280" cy="316" rx="185" ry="26" fill={`url(#${idPrefix}-shadow)`} />

        {productId === 'yugal-halo-pair' ? (
          <g>
            {/* Left Ring — Primary */}
            <g transform="translate(216, 195) rotate(-14)">
              <ellipse
                cx="0"
                cy="0"
                rx="84"
                ry="84"
                fill="none"
                stroke={`url(#${idPrefix}-metal)`}
                strokeWidth="26"
              />
              <ellipse
                cx="0"
                cy="0"
                rx="96"
                ry="96"
                fill="none"
                stroke={specular}
                strokeWidth="1.2"
              />
              <ellipse
                cx="0"
                cy="0"
                rx="71"
                ry="71"
                fill="none"
                stroke={innerRim}
                strokeOpacity="0.45"
                strokeWidth="1.5"
              />
              {/* Micro-LRA Sapphire Pulse Channel */}
              <path
                d="M -69 -16 A 71 71 0 0 1 -58 -41"
                fill="none"
                stroke="#B8293D"
                strokeWidth="3.2"
                strokeLinecap="round"
                opacity={pulseActive ? 1 : 0.72}
              />
            </g>

            {/* Right Ring — Partner (Interlocked) */}
            <g transform="translate(342, 202) rotate(14)">
              <ellipse
                cx="0"
                cy="0"
                rx="80"
                ry="80"
                fill="none"
                stroke={`url(#${idPrefix}-metal-alt)`}
                strokeWidth="24"
              />
              <ellipse
                cx="0"
                cy="0"
                rx="91"
                ry="91"
                fill="none"
                stroke={specular}
                strokeWidth="1.2"
              />
              <ellipse
                cx="0"
                cy="0"
                rx="68"
                ry="68"
                fill="none"
                stroke={innerRim}
                strokeOpacity="0.45"
                strokeWidth="1.5"
              />
              {/* Micro-LRA Sapphire Pulse Channel */}
              <path
                d="M 55 40 A 68 68 0 0 1 67 12"
                fill="none"
                stroke="#B8293D"
                strokeWidth="3.2"
                strokeLinecap="round"
                opacity={pulseActive ? 1 : 0.72}
              />
            </g>
          </g>
        ) : (
          <g>
            {/* Primary Cuff Bracelet */}
            <g transform="translate(232, 186) rotate(-12)">
              <rect
                x="-110"
                y="-64"
                width="220"
                height="128"
                rx="64"
                fill="none"
                stroke={`url(#${idPrefix}-metal)`}
                strokeWidth="22"
              />
              <rect
                x="-120"
                y="-74"
                width="240"
                height="148"
                rx="74"
                fill="none"
                stroke={specular}
                strokeWidth="1.2"
              />
              {/* Flush LRA Tactile Clasp */}
              <rect
                x="-38"
                y="-75"
                width="76"
                height="22"
                rx="7"
                fill={isCeramic ? '#111216' : '#D9DDE5'}
                stroke={innerRim}
                strokeWidth="1"
              />
              <line
                x1="-18"
                y1="-64"
                x2="18"
                y2="-64"
                stroke="#B8293D"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </g>

            {/* Partner Cuff Bracelet */}
            <g transform="translate(332, 212) rotate(11)">
              <rect
                x="-104"
                y="-60"
                width="208"
                height="120"
                rx="60"
                fill="none"
                stroke={`url(#${idPrefix}-metal-alt)`}
                strokeWidth="20"
              />
              <rect
                x="-113"
                y="-69"
                width="226"
                height="138"
                rx="69"
                fill="none"
                stroke={specular}
                strokeWidth="1.2"
              />
              {/* Flush LRA Tactile Clasp */}
              <rect
                x="-34"
                y="50"
                width="68"
                height="20"
                rx="7"
                fill={isCeramic ? '#111216' : '#D9DDE5'}
                stroke={innerRim}
                strokeWidth="1"
              />
              <line
                x1="-16"
                y1="60"
                x2="16"
                y2="60"
                stroke="#B8293D"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </g>
          </g>
        )}

        {/* Inner Engraving Preview */}
        {engraving.trim().length > 0 && (
          <g transform="translate(280, 356)">
            <text
              textAnchor="middle"
              fill="#525560"
              fontSize="11"
              fontFamily="IBM Plex Mono, monospace"
              letterSpacing="0.18em"
            >
              INNER ENGRAVING · {engraving.trim().toUpperCase()}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

interface HapticWaveCanvasProps {
  activeType: TouchType;
  bpm: number;
  intensity: number;
  isPressing: boolean;
  triggerNonce: number;
}

/**
 * 60fps HTML5 Canvas visualizing real-time LRA tactile pressure envelopes and cardiac ECG waves.
 */
export function HapticWaveCanvas({
  activeType,
  bpm,
  intensity,
  isPressing,
  triggerNonce,
}: HapticWaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pulseBoostRef = useRef(0);

  useEffect(() => {
    if (triggerNonce > 0) {
      pulseBoostRef.current = 1;
    }
  }, [triggerNonce]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let t = 0;

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const midY = h * 0.52;

      ctx.clearRect(0, 0, w, h);

      // Subtle architectural baseline grid
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      pulseBoostRef.current = Math.max(0, pulseBoostRef.current - 0.015);
      const energy = (intensity / 100) * (isPressing ? 1.35 : 0.72 + pulseBoostRef.current * 0.65);

      ctx.beginPath();
      ctx.strokeStyle = '#E0485E';
      ctx.lineWidth = isPressing || pulseBoostRef.current > 0.1 ? 2.4 : 1.8;

      const samples = Math.max(120, Math.floor(w / 2));
      for (let i = 0; i <= samples; i++) {
        const u = i / samples;
        const x = u * w;
        const edgeFade = Math.sin(u * Math.PI);
        let yOffset = 0;

        if (activeType === 'heartbeat') {
          const beatsPerScreen = (bpm / 60) * 1.45;
          const phase = ((u * beatsPerScreen - t * 0.45) % 1 + 1) % 1;
          // Synthetic clean P-QRS-T cardiac waveform
          if (phase > 0.1 && phase < 0.18) {
            yOffset = -Math.sin(((phase - 0.1) / 0.08) * Math.PI) * 6;
          } else if (phase >= 0.22 && phase < 0.25) {
            yOffset = 7;
          } else if (phase >= 0.25 && phase < 0.29) {
            yOffset = -Math.sin(((phase - 0.25) / 0.04) * Math.PI) * 34;
          } else if (phase >= 0.29 && phase < 0.33) {
            yOffset = 12 * Math.sin(((phase - 0.29) / 0.04) * Math.PI);
          } else if (phase >= 0.42 && phase < 0.56) {
            yOffset = -Math.sin(((phase - 0.42) / 0.14) * Math.PI) * 11;
          }
          yOffset *= energy * edgeFade;
        } else if (activeType === 'double_tap') {
          const p1 = Math.exp(-Math.pow((u - 0.38 - Math.sin(t) * 0.03) * 14, 2));
          const p2 = Math.exp(-Math.pow((u - 0.56 - Math.sin(t) * 0.03) * 14, 2));
          yOffset = -(p1 * 26 + p2 * 30) * Math.cos((u * 26 - t * 6)) * energy * edgeFade;
        } else if (activeType === 'goodnight') {
          yOffset =
            Math.sin(u * Math.PI * 3.5 - t * 1.8) *
            (1 - u * 0.45) *
            18 *
            energy *
            edgeFade;
        } else {
          // Gentle squeeze / warm pulse tactile envelope
          const carrier = Math.sin(u * Math.PI * 6 - t * 3.2);
          const harmonic = Math.sin(u * Math.PI * 11 - t * 4.8) * 0.32;
          yOffset = (carrier + harmonic) * 20 * energy * edgeFade;
        }

        const y = midY + yOffset;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Secondary ghost harmonic line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= samples; i++) {
        const u = i / samples;
        const x = u * w;
        const edgeFade = Math.sin(u * Math.PI);
        const y = midY + Math.sin(u * Math.PI * 4 - t * 2.1 + 1.1) * 8 * energy * edgeFade;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      t += 0.025;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeType, bpm, intensity, isPressing]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-36 block"
      aria-label="Live tactile LRA and heartbeat waveform"
    />
  );
}
