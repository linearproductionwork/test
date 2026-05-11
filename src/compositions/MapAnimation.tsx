import React from "react";
import { useCurrentFrame } from "remotion";
import { MapboxMap } from "../components/MapboxMap";
import { easeInOutCubic, easeInOutSine, remap, clamp01 } from "../lib/easing";
import { LA, NY, slerpLatLng } from "../lib/geo";

// ─── Timeline constants (frames @ 30fps) ─────────────────────────────────────
//
//  0 – 15   : Hold on LA at full zoom (establishes location)
// 15 – 105  : Smooth zoom out from city-level (zoom 11) to continental (zoom 4.8)
// 105 – 135 : Brief hold on full-US view, LA dot visible
// 135 – 300 : Line draws LA → NY; camera follows the line tip
//
// Total: 300 frames = 10 seconds

const HOLD_START_END = 15;
const ZOOM_OUT_END = 105;
const HOLD_US_END = 135;
const TOTAL = 300;

const ZOOM_CLOSE = 11;
const ZOOM_WIDE = 4.8;

export const MapAnimation: React.FC = () => {
  const frame = useCurrentFrame();

  // ── Zoom curve ────────────────────────────────────────────────────────────
  const zoomT = easeInOutCubic(
    clamp01(remap(frame, HOLD_START_END, ZOOM_OUT_END, 0, 1))
  );
  const zoom = ZOOM_CLOSE - (ZOOM_CLOSE - ZOOM_WIDE) * zoomT;

  // ── Line progress (0 → 1 over the travel phase) ───────────────────────────
  const lineProgress =
    frame < HOLD_US_END
      ? 0
      : easeInOutSine(clamp01(remap(frame, HOLD_US_END, TOTAL, 0, 1)));

  // ── Camera center ─────────────────────────────────────────────────────────
  // Before travel phase: stay on LA.
  // During travel phase: track the line tip along the geodesic arc so the
  // camera smoothly follows the animated line head with no extra lag.
  const center =
    lineProgress === 0 ? LA : slerpLatLng(LA, NY, lineProgress);

  return <MapboxMap center={center} zoom={zoom} lineProgress={lineProgress} />;
};
