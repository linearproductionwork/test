export interface LatLng {
  lat: number;
  lng: number;
}

export const LA: LatLng = { lat: 34.0522, lng: -118.2437 };
export const NY: LatLng = { lat: 40.7128, lng: -74.006 };

/** Linear interpolation between two lat/lng points (fine for zoom 4-6). */
export function lerpLatLng(from: LatLng, to: LatLng, t: number): LatLng {
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}

/**
 * Spherical linear interpolation (great circle) between two lat/lng points.
 * Produces the geodesic arc that air routes follow, arcing slightly northward
 * from LA to NY.
 */
export function slerpLatLng(from: LatLng, to: LatLng, t: number): LatLng {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const lat1 = toRad(from.lat);
  const lng1 = toRad(from.lng);
  const lat2 = toRad(to.lat);
  const lng2 = toRad(to.lng);

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2
      )
    );

  if (d < 1e-10) return from;

  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);

  const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
  const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);

  return {
    lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
    lng: toDeg(Math.atan2(y, x)),
  };
}

/** Pre-compute waypoints along the geodesic route (used every frame for line rendering). */
export function computeGeodesicWaypoints(
  from: LatLng,
  to: LatLng,
  count: number
): LatLng[] {
  return Array.from({ length: count }, (_, i) => slerpLatLng(from, to, i / (count - 1)));
}

export const ROUTE_WAYPOINTS = computeGeodesicWaypoints(LA, NY, 80);
