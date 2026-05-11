import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

// ─── Pill geometry ────────────────────────────────────────────────────────────
const PILL_W = 1600;
const PILL_H = 170;
const PILL_R = PILL_H / 2; // full-pill corner radius

// ─── Color palette (teal / cyan — "In Progress") ──────────────────────────────
const C = {
  core: "#ffffff",
  orbInner: "#c0fff6",
  bright: "#00ffe8",
  mid: "#00c9ab",
  dim: "#007a68",
  pillTop: "#0d3038",
  pillBottom: "#030e12",
  border: "rgba(0,210,185,0.22)",
  borderBright: "#00ffe8",
  glassSheen: "rgba(255,255,255,0.045)",
};

// ─── Orbital tail config ──────────────────────────────────────────────────────
const TAIL_STEPS = 28;
const TAIL_LENGTH = 0.13; // fraction of perimeter covered by each tail

// ─── Perimeter math ───────────────────────────────────────────────────────────
// Returns a point on the pill perimeter at fractional position `frac` (0–1),
// relative to pill center. Traversal: clockwise starting from top of right cap.
function perimeterPoint(
  frac: number,
  w: number,
  h: number
): { x: number; y: number } {
  const r = h / 2;
  const straight = w - h; // length of each flat section
  const semiArc = Math.PI * r; // length of each semicircular arc
  const P = 2 * semiArc + 2 * straight; // total perimeter
  let d = (((frac % 1) + 1) % 1) * P;

  // 1. Right semicircle — center (w/2 − r, 0), θ: −π/2 → +π/2
  if (d <= semiArc) {
    const θ = -Math.PI / 2 + (d / semiArc) * Math.PI;
    return { x: w / 2 - r + r * Math.cos(θ), y: r * Math.sin(θ) };
  }
  d -= semiArc;

  // 2. Bottom straight — right to left, y = +h/2
  if (d <= straight) {
    return { x: w / 2 - r - d, y: h / 2 };
  }
  d -= straight;

  // 3. Left semicircle — center (−(w/2 − r), 0), θ: +π/2 → +3π/2
  if (d <= semiArc) {
    const θ = Math.PI / 2 + (d / semiArc) * Math.PI;
    return { x: -(w / 2 - r) + r * Math.cos(θ), y: r * Math.sin(θ) };
  }
  d -= semiArc;

  // 4. Top straight — left to right, y = −h/2
  return { x: -(w / 2 - r) + d, y: -h / 2 };
}

// ─── Component ────────────────────────────────────────────────────────────────
export const PillOrbit: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const progress = frame / durationInFrames; // 0 → 1 over the loop
  const cx = width / 2;
  const cy = height / 2;

  // Two orbs, permanently 180° apart
  const frac1 = progress;
  const frac2 = (progress + 0.5) % 1;

  const orb1 = perimeterPoint(frac1, PILL_W, PILL_H);
  const orb2 = perimeterPoint(frac2, PILL_W, PILL_H);

  // Subtle breathe pulse synced to orbit (peaks when orbs hit long straights)
  const breathe = 0.8 + 0.2 * Math.sin(progress * Math.PI * 2);

  // Build comet tail point arrays for each orb
  const buildTail = (frac: number) =>
    Array.from({ length: TAIL_STEPS }, (_, i) =>
      perimeterPoint(frac - (i / TAIL_STEPS) * TAIL_LENGTH, PILL_W, PILL_H)
    );

  const tail1 = buildTail(frac1);
  const tail2 = buildTail(frac2);

  // Pill rect props (reused across layers)
  const pill = {
    x: cx - PILL_W / 2,
    y: cy - PILL_H / 2,
    width: PILL_W,
    height: PILL_H,
    rx: PILL_R,
  };

  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* ── Blur filters ──────────────────────────────────────────────── */}
        {/* Extra-large: wide ambient halo */}
        <filter id="f-xl" x="-400%" y="-400%" width="900%" height="900%">
          <feGaussianBlur stdDeviation="45" />
        </filter>
        {/* Large: bokeh shell */}
        <filter id="f-lg" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        {/* Medium: mid glow */}
        <filter id="f-md" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        {/* Small: tight crisp glow */}
        <filter id="f-sm" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>

        {/* ── Pill fill: dark teal radial gradient ──────────────────────── */}
        <radialGradient id="pill-fill" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={C.pillTop} />
          <stop offset="100%" stopColor={C.pillBottom} />
        </radialGradient>

        {/* ── Pill glass sheen: top-half highlight strip ────────────────── */}
        <linearGradient id="pill-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.glassSheen} stopOpacity="1" />
          <stop offset="100%" stopColor={C.glassSheen} stopOpacity="0" />
        </linearGradient>

        {/* ── Reactive border masks (radial gradient centered at each orb) ─ */}
        <radialGradient
          id="rg-mask1"
          cx={cx + orb1.x}
          cy={cy + orb1.y}
          r={230}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="55%" stopColor="white" stopOpacity="0.45" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="rg-mask2"
          cx={cx + orb2.x}
          cy={cy + orb2.y}
          r={230}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="55%" stopColor="white" stopOpacity="0.45" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        <mask id="border-mask1">
          <rect width={width} height={height} fill="url(#rg-mask1)" />
        </mask>
        <mask id="border-mask2">
          <rect width={width} height={height} fill="url(#rg-mask2)" />
        </mask>

        {/* ── Clip path: inside the pill only ───────────────────────────── */}
        <clipPath id="pill-clip">
          <rect {...pill} />
        </clipPath>
      </defs>

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 1 — Far ambient halo (soft teal fog around each orb)
      ══════════════════════════════════════════════════════════════════════ */}
      {[orb1, orb2].map((orb, i) => (
        <circle
          key={`halo-${i}`}
          cx={cx + orb.x}
          cy={cy + orb.y}
          r={160}
          fill={C.mid}
          opacity={0.1 * breathe}
          filter="url(#f-xl)"
        />
      ))}

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 2 — Pill body (glassmorphism dark teal fill)
      ══════════════════════════════════════════════════════════════════════ */}
      <rect {...pill} fill="url(#pill-fill)" />

      {/* Top-half glass sheen */}
      <rect
        x={pill.x + 2}
        y={pill.y + 2}
        width={PILL_W - 4}
        height={PILL_H / 2 - 2}
        rx={PILL_R - 2}
        fill="url(#pill-sheen)"
      />

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 3 — Reactive inner glow (orb bleeds into pill interior)
      ══════════════════════════════════════════════════════════════════════ */}
      <g clipPath="url(#pill-clip)">
        {[orb1, orb2].map((orb, i) => (
          <circle
            key={`inner-${i}`}
            cx={cx + orb.x}
            cy={cy + orb.y}
            r={240}
            fill={C.bright}
            opacity={0.09 * breathe}
            filter="url(#f-lg)"
          />
        ))}
      </g>

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 4 — Base pill border (always-on dim outline)
      ══════════════════════════════════════════════════════════════════════ */}
      <rect {...pill} fill="none" stroke={C.border} strokeWidth={1.5} />

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 5 — Reactive border highlight (bright stroke, masked to orb area)
      ══════════════════════════════════════════════════════════════════════ */}
      <rect
        {...pill}
        fill="none"
        stroke={C.borderBright}
        strokeWidth={3.5}
        mask="url(#border-mask1)"
      />
      <rect
        {...pill}
        fill="none"
        stroke={C.borderBright}
        strokeWidth={3.5}
        mask="url(#border-mask2)"
      />

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 6 — Comet tails (trail of decaying blurred circles)
      ══════════════════════════════════════════════════════════════════════ */}
      {[tail1, tail2].map((tail, ti) =>
        tail.map((pt, i) => {
          const t = i / TAIL_STEPS;
          const opacity = Math.pow(1 - t, 1.6) * 0.88;
          const r = (1 - t) * 10 + 1.5;
          const color = i < 6 ? C.bright : C.mid;
          const filter = i < 10 ? "url(#f-sm)" : "url(#f-md)";
          return (
            <circle
              key={`tail-${ti}-${i}`}
              cx={cx + pt.x}
              cy={cy + pt.y}
              r={r}
              fill={color}
              opacity={opacity}
              filter={filter}
            />
          );
        })
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 7 — Orb: wide bokeh → mid glow → core glow → hard core
      ══════════════════════════════════════════════════════════════════════ */}
      {[orb1, orb2].map((orb, i) => (
        <g key={`orb-${i}`}>
          {/* Wide bokeh shell */}
          <circle
            cx={cx + orb.x}
            cy={cy + orb.y}
            r={90}
            fill={C.dim}
            opacity={0.4 * breathe}
            filter="url(#f-xl)"
          />
          {/* Mid bokeh */}
          <circle
            cx={cx + orb.x}
            cy={cy + orb.y}
            r={50}
            fill={C.mid}
            opacity={0.55 * breathe}
            filter="url(#f-lg)"
          />
          {/* Inner bright glow */}
          <circle
            cx={cx + orb.x}
            cy={cy + orb.y}
            r={22}
            fill={C.bright}
            opacity={0.85 * breathe}
            filter="url(#f-md)"
          />
          {/* Tight core halo */}
          <circle
            cx={cx + orb.x}
            cy={cy + orb.y}
            r={9}
            fill={C.orbInner}
            opacity={0.95}
            filter="url(#f-sm)"
          />
          {/* Hard specular core */}
          <circle
            cx={cx + orb.x}
            cy={cy + orb.y}
            r={4}
            fill={C.core}
            opacity={1}
          />
        </g>
      ))}
    </svg>
  );
};
