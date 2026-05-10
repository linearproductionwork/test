import { useCurrentFrame, useVideoConfig, Img, staticFile, interpolate } from "remotion";

export const MotionBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const t = frame / fps;

  // Slow Ken Burns — 4% zoom over 10s, barely perceptible but removes static feel
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.04], {
    extrapolateRight: "clamp",
  });

  // Gentle slow drift — moves in image space, feels like a breath
  const driftX = interpolate(frame, [0, durationInFrames], [0, -8], {
    extrapolateRight: "clamp",
  });
  const driftY = interpolate(frame, [0, durationInFrames], [0, 5], {
    extrapolateRight: "clamp",
  });

  // Per-frame grain seed — gives true animated film grain on every rendered frame
  const grainSeed = frame % 200;

  // Subtle breathing on the light region — one slow cycle over ~6s
  const breathe = Math.sin(t * (1 / 6) * Math.PI * 2) * 0.5 + 0.5;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "#030810",
      }}
    >
      {/* ── Real image — portrait 9:16, rotated -90° CCW to landscape 16:9 ──
          Pre-rotation size 1080×1920 centered at canvas origin (960, 540)
          so after rotation it fills 1920×1080 exactly. Scale + drift ride
          the same transform so Ken Burns stays anchored to canvas center. */}
      <Img
        src={staticFile("bg.jpg")}
        style={{
          position: "absolute",
          width: 1080,
          height: 1920,
          left: 420,   // (1920 - 1080) / 2
          top: -420,   // (1080 - 1920) / 2
          transformOrigin: "center center",
          transform: `rotate(-90deg) scale(${scale}) translate(${driftX}px, ${driftY}px)`,
          objectFit: "cover",
        }}
      />

      {/* ── Subtle light bloom — breathes slightly over the bright area,
          colour-matched to the image so it feels intrinsic not overlaid ── */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 600,
          left: -120,
          top: -80,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(30,140,175,0.10) 0%, transparent 65%)",
          opacity: 0.3 + breathe * 0.18,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* ── Vignette — deepens corners so it reads as cinematic ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 45%, rgba(1,4,10,0.72) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Film grain pass 1 — coarse, overlay blend ── */}
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

      {/* ── Film grain pass 2 — finer, screen blend, lifts mid-tones ── */}
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
