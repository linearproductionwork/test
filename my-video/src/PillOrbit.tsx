import React from "react";
import { useCurrentFrame } from "remotion";

// ─── Pill geometry ────────────────────────────────────────────────────────────
const PILL_W = 560;
const PILL_H = 100;
const R = PILL_H / 2; // border-radius = half height → perfect pill
const STRAIGHT = PILL_W - PILL_H; // length of each straight segment
const SEMI = Math.PI * R; // half-circumference
const TOTAL = 2 * STRAIGHT + 2 * SEMI; // full perimeter

// ─── Animation ────────────────────────────────────────────────────────────────
const ORBIT_FRAMES = 210; // one full revolution (7 s at 30 fps)
const TRAIL_STEPS = 10; // ghost positions per orb

// ─── Color palette (teal "In Progress" vibe from reference) ───────────────────
const ORB_A = "#00FFD4"; // cyan-mint (orb 1)
const ORB_B = "#38B6FF"; // sky-blue   (orb 2, 180° opposite)

// ─── Perimeter math ──────────────────────────────────────────────────────────
// Returns {x, y} on the pill border for progress ∈ [0,1], clockwise.
// Origin: top-left corner of the pill bounding rect.
function pointOnPerimeter(progress: number): { x: number; y: number } {
  const d = (((progress % 1) + 1) % 1) * TOTAL;

  if (d <= STRAIGHT) {
    // Top edge → left to right
    return { x: R + d, y: 0 };
  }

  if (d <= STRAIGHT + SEMI) {
    // Right semicircle → top to bottom
    const a = (d - STRAIGHT) / R - Math.PI / 2;
    return {
      x: PILL_W - R + R * Math.cos(a),
      y: R + R * Math.sin(a),
    };
  }

  if (d <= 2 * STRAIGHT + SEMI) {
    // Bottom edge → right to left
    return { x: PILL_W - R - (d - STRAIGHT - SEMI), y: PILL_H };
  }

  // Left semicircle → bottom to top
  const a = Math.PI / 2 + (d - 2 * STRAIGHT - SEMI) / R;
  return {
    x: R + R * Math.cos(a),
    y: R + R * Math.sin(a),
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Renders one orb with a fading comet trail. */
function Orb({ progress, color }: { progress: number; color: string }) {
  // Build trail: index 0 = oldest (tail), last index = head (brightest)
  const steps = TRAIL_STEPS + 1;
  return (
    <>
      {Array.from({ length: steps }).map((_, i) => {
        const trailFrac = ((steps - 1 - i) / steps) * 0.055; // max 5.5% behind
        const pt = pointOnPerimeter(progress - trailFrac);
        const isHead = i === steps - 1;
        const alpha = isHead ? 1 : (i / steps) * 0.45;
        const diameter = isHead ? 11 : 11 * (0.3 + 0.7 * (i / steps));

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pt.x,
              top: pt.y,
              width: diameter,
              height: diameter,
              borderRadius: "50%",
              background: color,
              opacity: alpha,
              transform: "translate(-50%, -50%)",
              filter: isHead ? undefined : `blur(${2 + (steps - i) * 0.3}px)`,
              boxShadow: isHead
                ? [
                    `0 0 6px 3px ${color}`,
                    `0 0 18px 9px ${color}BB`,
                    `0 0 45px 22px ${color}66`,
                    `0 0 90px 45px ${color}33`,
                  ].join(", ")
                : undefined,
            }}
          />
        );
      })}
    </>
  );
}

/** Static glass pill body. */
function PillBody() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: R,
        // Glassy dark teal fill
        background:
          "linear-gradient(145deg, rgba(0,200,175,0.13) 0%, rgba(0,90,160,0.09) 100%)",
        // Subtle luminous border
        border: "1.5px solid rgba(0,220,195,0.28)",
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.05) inset",
          "0 0 30px 0px rgba(0,200,175,0.12) inset",
          "0 8px 40px rgba(0,0,0,0.55)",
        ].join(", "),
      }}
    >
      {/* Top specular highlight */}
      <div
        style={{
          position: "absolute",
          top: 1,
          left: R + 4,
          right: R + 4,
          height: "38%",
          borderRadius: `${R}px ${R}px 60% 60% / 30px 30px 20px 20px`,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.09) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

// ─── Main composition ─────────────────────────────────────────────────────────

export const PillOrbit: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = (frame / ORBIT_FRAMES) % 1;

  const sceneW = 1920;
  const sceneH = 1080;
  const pillLeft = (sceneW - PILL_W) / 2;
  const pillTop = (sceneH - PILL_H) / 2;

  // Pulse: gentle brightness rhythm (period ~4 s)
  const pulse = 0.5 + 0.5 * Math.sin((frame / 120) * Math.PI * 2);

  return (
    <div
      style={{
        width: sceneW,
        height: sceneH,
        background: "#060A10",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Far ambient glow behind the pill ── */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 900,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, rgba(0,180,160,${
            0.055 + pulse * 0.025
          }) 0%, transparent 68%)`,
          pointerEvents: "none",
        }}
      />

      {/* ── Pill + orbs (single positioned context) ── */}
      <div
        style={{
          position: "absolute",
          left: pillLeft,
          top: pillTop,
          width: PILL_W,
          height: PILL_H,
          // Overflow visible so orb glows bleed outside the bounding rect
        }}
      >
        <PillBody />

        {/* Orb A — starts at top-left quadrant */}
        <Orb progress={progress} color={ORB_A} />

        {/* Orb B — exactly 180° opposite */}
        <Orb progress={progress + 0.5} color={ORB_B} />
      </div>

      {/* ── Ultra-subtle vignette ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
