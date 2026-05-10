import { useCurrentFrame, useVideoConfig, Img, staticFile, interpolate } from "remotion";

export const MotionBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const t = frame / fps;

  // Slow Ken Burns — barely perceptible zoom, adds life without distraction
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });

  // Very slow drift in image space
  const driftX = interpolate(frame, [0, durationInFrames], [0, -10], {
    extrapolateRight: "clamp",
  });
  const driftY = interpolate(frame, [0, durationInFrames], [0, 6], {
    extrapolateRight: "clamp",
  });

  // Breathing light over the glow region — one slow 6s cycle
  const breathe = Math.sin(t * (1 / 6) * Math.PI * 2) * 0.5 + 0.5;

  // Per-frame grain seed for animated film grain
  const grainSeed = frame % 200;

  return (
    // No overflow:hidden here — Remotion's canvas clips to 1920×1080 naturally.
    // overflow:hidden on the root would clip the portrait wrapper in pre-rotation
    // layout space, causing the black-bars bug seen in the studio preview.
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#030810" }}>

      {/* ── Portrait wrapper, rotated -90° CCW to fill landscape canvas ──
          1080×1920 centered at canvas origin (960,540) so after rotation
          it maps exactly onto 1920×1080. Transform-origin is the element's
          own center, which equals the canvas center. */}
      <div
        style={{
          position: "absolute",
          width: 1080,
          height: 1920,
          left: 420,    // (1920 − 1080) / 2
          top: -420,    // (1080 − 1920) / 2
          transformOrigin: "center center",
          transform: `rotate(-90deg) scale(${scale}) translate(${driftX}px, ${driftY}px)`,
        }}
      >
        <Img
          src={staticFile("bg.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      {/* ── Subtle breathing bloom over the image's bright teal region ──
          Colour-matched so it feels intrinsic, not overlaid. */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 700,
          left: -160,
          top: -100,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(20,130,165,0.09) 0%, transparent 65%)",
          opacity: 0.25 + breathe * 0.2,
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />

      {/* ── Vignette — deepens corners, keeps focus on the light source ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 82% 82% at 50% 50%, transparent 42%, rgba(1,4,10,0.75) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Film grain pass 1 — coarse fractalNoise, overlay blend ── */}
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

      {/* ── Film grain pass 2 — fine, screen blend, lifts mid-tones ── */}
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
