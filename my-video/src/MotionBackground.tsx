import { useCurrentFrame, useVideoConfig } from "remotion";

export const MotionBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t = frame / fps;

  // Slow, organic breathing cycles — all offset so they never sync
  const breathe1 = Math.sin(t * 0.35 * Math.PI * 2) * 0.5 + 0.5;
  const breathe2 = Math.sin(t * 0.22 * Math.PI * 2 + 1.8) * 0.5 + 0.5;
  const breathe3 = Math.sin(t * 0.18 * Math.PI * 2 + 3.4) * 0.5 + 0.5;

  // Subtle slow drift — imperceptible moment-to-moment, visible as life
  const driftX = Math.sin(t * 0.1 * Math.PI * 2) * 40;
  const driftY = Math.cos(t * 0.08 * Math.PI * 2) * 25;
  const driftX2 = Math.sin(t * 0.07 * Math.PI * 2 + 2.1) * 30;
  const driftY2 = Math.cos(t * 0.11 * Math.PI * 2 + 1.0) * 35;

  // Grain seed cycles so film grain animates every frame
  const grainSeed = frame % 200;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "#03090f",
      }}
    >
      {/* ── Base gradient ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 120% 90% at 10% 20%, #0b3248 0%, #050e1a 55%, #020609 100%)",
        }}
      />

      {/* ── Upper-left teal bloom ── */}
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 850,
          left: -280 + driftX * 0.6,
          top: -220 + driftY * 0.5,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(14,72,105,0.95) 0%, rgba(8,44,70,0.55) 38%, transparent 68%)",
          opacity: 0.72 + breathe1 * 0.22,
          filter: "blur(72px)",
        }}
      />

      {/* ── Bright cyan accent — left-center ── */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 950,
          left: -180 + driftX2 * 0.4,
          top: 80 + driftY2 * 0.5,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(38,152,183,0.65) 0%, rgba(18,95,130,0.3) 38%, transparent 65%)",
          opacity: 0.45 + breathe2 * 0.3,
          filter: "blur(90px)",
        }}
      />

      {/* ── Deep secondary bloom — upper-centre ── */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 600,
          left: 200 + driftX * 0.3,
          top: -100 + driftY * 0.4,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(10,58,88,0.7) 0%, rgba(5,28,48,0.35) 45%, transparent 70%)",
          opacity: 0.55 + breathe3 * 0.2,
          filter: "blur(100px)",
        }}
      />

      {/* ── Dark vignette corners ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 38%, rgba(2,6,14,0.82) 100%)",
        }}
      />

      {/* ── Subtle specular highlight — upper-left edge ── */}
      <div
        style={{
          position: "absolute",
          width: 380,
          height: 480,
          left: -60 + driftX * 0.2,
          top: 60 + driftY * 0.3,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(80,200,230,0.18) 0%, transparent 65%)",
          opacity: 0.5 + breathe1 * 0.4,
          filter: "blur(40px)",
        }}
      />

      {/* ── Animated film grain ── */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          mixBlendMode: "overlay",
          opacity: 0.28,
          pointerEvents: "none",
        }}
      >
        <filter id="grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.68"
            numOctaves="4"
            seed={grainSeed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* ── Second grain pass — finer, additive, gives depth ── */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          mixBlendMode: "screen",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      >
        <filter id="grain2" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="2"
            seed={(grainSeed + 73) % 200}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain2)" />
      </svg>
    </div>
  );
};
