import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const MotionBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const t = frame / fps;

  // Slow breath — orb pulses gently, ~4s cycle
  const breathe = Math.sin(t * (1 / 4) * Math.PI * 2) * 0.5 + 0.5;

  // Secondary shimmer — slightly faster, offset phase
  const shimmer = Math.sin(t * (1 / 2.6) * Math.PI * 2 + 1.4) * 0.5 + 0.5;

  // Very slow drift — imperceptible moment-to-moment, alive over 10s
  const driftX = interpolate(frame, [0, durationInFrames], [0, 18], {
    extrapolateRight: "clamp",
  });
  const driftY = interpolate(frame, [0, durationInFrames], [0, -12], {
    extrapolateRight: "clamp",
  });

  // Orb scale breathes between 1.0 and 1.06
  const orbScale = 1.0 + breathe * 0.06;

  // Per-frame grain seed
  const grainSeed = frame % 200;

  // Orb center — matches reference: right-of-center, slightly low
  const cx = 1920 * 0.58 + driftX;
  const cy = 1080 * 0.56 + driftY;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "#000005",
      }}
    >
      {/* ── Outer diffuse halo ── */}
      <div
        style={{
          position: "absolute",
          width: 960,
          height: 960,
          left: cx - 480,
          top: cy - 480,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(18,40,220,0.38) 0%, rgba(8,18,140,0.18) 40%, transparent 70%)",
          opacity: 0.7 + breathe * 0.25,
          filter: "blur(60px)",
          transform: `scale(${orbScale})`,
          transformOrigin: "center center",
        }}
      />

      {/* ── Mid blue glow ── */}
      <div
        style={{
          position: "absolute",
          width: 560,
          height: 560,
          left: cx - 280,
          top: cy - 280,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(40,80,255,0.72) 0%, rgba(18,45,210,0.45) 38%, transparent 68%)",
          opacity: 0.75 + shimmer * 0.2,
          filter: "blur(32px)",
          transform: `scale(${orbScale})`,
          transformOrigin: "center center",
        }}
      />

      {/* ── Bright inner core ── */}
      <div
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          left: cx - 110,
          top: cy - 110,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(210,225,255,0.95) 0%, rgba(100,140,255,0.80) 35%, rgba(40,80,240,0.50) 65%, transparent 85%)",
          opacity: 0.88 + breathe * 0.12,
          filter: "blur(10px)",
          transform: `scale(${orbScale})`,
          transformOrigin: "center center",
        }}
      />

      {/* ── Specular hot spot — the white peak ── */}
      <div
        style={{
          position: "absolute",
          width: 80,
          height: 80,
          left: cx - 40,
          top: cy - 40,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.95) 0%, rgba(200,215,255,0.60) 55%, transparent 80%)",
          opacity: 0.80 + shimmer * 0.18,
          filter: "blur(4px)",
          transform: `scale(${orbScale})`,
          transformOrigin: "center center",
        }}
      />

      {/* ── Vignette — pushes pure black into corners ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 70% at 58% 56%, transparent 30%, rgba(0,0,4,0.88) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Film grain pass 1 — coarse, overlay ── */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          mixBlendMode: "overlay",
          opacity: 0.30,
          pointerEvents: "none",
        }}
      >
        <filter id="grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.66"
            numOctaves="4"
            seed={grainSeed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* ── Film grain pass 2 — fine, screen, lifts mid-tones ── */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          mixBlendMode: "screen",
          opacity: 0.07,
          pointerEvents: "none",
        }}
      >
        <filter id="grain2" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.84"
            numOctaves="2"
            seed={(grainSeed + 61) % 200}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain2)" />
      </svg>
    </div>
  );
};
