import { useCurrentFrame, useVideoConfig, staticFile, interpolate } from "remotion";

export const MotionBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const t = frame / fps;

  // Ken Burns — slow zoom, 5% over 10 s
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });

  // Gentle breathing bloom over the image's bright region
  const breathe = Math.sin(t * (1 / 6) * Math.PI * 2) * 0.5 + 0.5;

  // Per-frame grain seed → animated film grain on every rendered frame
  const grainSeed = frame % 200;

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
      {/*
        SVG handles the rotation internally.
        Unlike CSS overflow:hidden (which clips at pre-transform layout bounds),
        SVG viewport clipping is applied to the final rendered position — so the
        portrait image rotated to landscape fills the canvas with no black bars.

        Ken Burns scale is a CSS transform on the SVG element itself; the root
        overflow:hidden clips the slight edge-bleed from the zoom.
      */}
      <svg
        width={1920}
        height={1080}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "960px 540px",
          transform: `scale(${scale})`,
        }}
      >
        {/*
          Portrait image (1080 × 1920) centered on canvas (left=420, top=-420),
          rotated -90 ° CCW around canvas center (960, 540).
          After rotation its four corners map to (0,0) (1920,0) (1920,1080) (0,1080).
        */}
        <image
          href={staticFile("bg.jpg")}
          x={420}
          y={-420}
          width={1080}
          height={1920}
          preserveAspectRatio="xMidYMid slice"
          transform="rotate(-90, 960, 540)"
        />
      </svg>

      {/* Subtle breathing bloom — colour-matched to the image's teal glow */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 700,
          left: -160,
          top: -100,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(20,130,165,0.09) 0%, transparent 65%)",
          opacity: 0.25 + breathe * 0.2,
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />

      {/* Vignette — darkens corners, keeps focus on the light source */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 82% 82% at 50% 50%, transparent 42%, rgba(1,4,10,0.75) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Film grain pass 1 — coarse, overlay blend */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          mixBlendMode: "overlay",
          opacity: 0.3,
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

      {/* Film grain pass 2 — fine, screen blend, lifts mid-tones */}
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
