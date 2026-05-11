import React, { useEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig, delayRender, continueRender } from "remotion";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LatLng } from "../lib/geo";
import { LA, NY, ROUTE_WAYPOINTS } from "../lib/geo";

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN ?? "";

// ─── Drawing constants ───────────────────────────────────────────────────────

const LINE_COLOR = "#c0392b";
const LINE_WIDTH = 4;
const MARKER_COLOR = "#1a1a2e";
const LABEL_FONT = "bold 18px 'Helvetica Neue', Arial, sans-serif";
const LABEL_SMALL_FONT = "13px 'Helvetica Neue', Arial, sans-serif";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  center: LatLng;
  zoom: number;
  lineProgress: number;
}

// ─── City marker + label ─────────────────────────────────────────────────────

function drawCityMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  sublabel: string,
  alpha: number = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Filled dot
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fillStyle = MARKER_COLOR;
  ctx.fill();

  // Label background pill
  ctx.font = LABEL_FONT;
  const labelW = ctx.measureText(label).width;
  ctx.font = LABEL_SMALL_FONT;
  const subW = ctx.measureText(sublabel).width;
  const pillW = Math.max(labelW, subW) + 20;
  const pillH = 46;
  const pillX = x + 18;
  const pillY = y - pillH / 2;

  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 6);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.shadowColor = "rgba(0,0,0,0.15)";
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Label text
  ctx.fillStyle = MARKER_COLOR;
  ctx.font = LABEL_FONT;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, pillX + 10, pillY + 28);

  ctx.font = LABEL_SMALL_FONT;
  ctx.fillStyle = "#666";
  ctx.fillText(sublabel, pillX + 10, pillY + 42);

  ctx.restore();
}

// ─── Line tip glow ───────────────────────────────────────────────────────────

function drawLineTip(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Outer glow ring
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(192, 57, 43, 0.2)";
  ctx.fill();

  // Mid glow
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(192, 57, 43, 0.45)";
  ctx.fill();

  // Core dot
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = LINE_COLOR;
  ctx.fill();

  // White center
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

// ─── Full overlay draw ────────────────────────────────────────────────────────

function drawOverlay(
  map: mapboxgl.Map,
  canvas: HTMLCanvasElement,
  lineProgress: number,
  width: number,
  height: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  const laPoint = map.project([LA.lng, LA.lat] as [number, number]);
  const nyPoint = map.project([NY.lng, NY.lat] as [number, number]);

  // Project all route waypoints to screen coords once
  const pts = ROUTE_WAYPOINTS.map((p) =>
    map.project([p.lng, p.lat] as [number, number])
  );

  // ── Animated route line ──────────────────────────────────────────
  if (lineProgress > 0) {
    const totalPts = pts.length;
    const rawEnd = lineProgress * (totalPts - 1);
    const endIdx = Math.min(Math.floor(rawEnd), totalPts - 1);
    const frac = rawEnd - Math.floor(rawEnd);

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= endIdx; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    if (endIdx < totalPts - 1) {
      const a = pts[endIdx];
      const b = pts[endIdx + 1];
      ctx.lineTo(a.x + (b.x - a.x) * frac, a.y + (b.y - a.y) * frac);
    }

    // Drop shadow for depth
    ctx.shadowColor = "rgba(192, 57, 43, 0.35)";
    ctx.shadowBlur = 6;
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tip glow (skip when line has just reached NY to let the arrival marker take over)
    let tipX: number, tipY: number;
    if (endIdx < totalPts - 1) {
      const a = pts[endIdx];
      const b = pts[endIdx + 1];
      tipX = a.x + (b.x - a.x) * frac;
      tipY = a.y + (b.y - a.y) * frac;
    } else {
      tipX = pts[totalPts - 1].x;
      tipY = pts[totalPts - 1].y;
    }
    if (lineProgress < 0.98) {
      drawLineTip(ctx, tipX, tipY);
    }
  }

  // ── City markers ─────────────────────────────────────────────────
  drawCityMarker(ctx, laPoint.x, laPoint.y, "Los Angeles", "California");

  if (lineProgress >= 0.92) {
    const nyAlpha = Math.min(1, (lineProgress - 0.92) / 0.08);
    drawCityMarker(ctx, nyPoint.x, nyPoint.y, "New York", "New York", nyAlpha);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MapboxMap: React.FC<Props> = ({ center, zoom, lineProgress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Always keep a ref to the latest props so the init callback can use them
  const latestProps = useRef({ center, zoom, lineProgress });
  latestProps.current = { center, zoom, lineProgress };

  // ── Map initialization (runs once) ─────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    if (!MAPBOX_TOKEN) {
      console.error(
        "[MapAnimation] No Mapbox token found. Set MAPBOX_TOKEN in your .env file."
      );
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [LA.lng, LA.lat],
      zoom: 11,
      interactive: false,
      preserveDrawingBuffer: true, // Required for Remotion frame capture
      fadeDuration: 0, // Disable tile fade-in to avoid mid-render flicker
      attributionControl: false,
    });

    mapRef.current = map;

    const initHandle = delayRender("Mapbox initialization");

    map.on("load", () => {
      mapReadyRef.current = true;
      const { center: c, zoom: z, lineProgress: lp } = latestProps.current;
      map.jumpTo({ center: [c.lng, c.lat], zoom: z });
      map.once("idle", () => {
        drawOverlay(map, canvasRef.current!, lp, width, height);
        continueRender(initHandle);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Per-frame camera update ────────────────────────────────────
  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) return;

    const map = mapRef.current;
    const handle = delayRender(`Frame ${frame}`);

    map.jumpTo({ center: [center.lng, center.lat], zoom });

    const onIdle = () => {
      drawOverlay(map, canvasRef.current!, lineProgress, width, height);
      continueRender(handle);
    };

    map.once("idle", onIdle);
    return () => {
      map.off("idle", onIdle);
    };
  }, [frame]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: "relative", width, height, background: "#f8f4f0" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
