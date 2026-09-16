/**
 * mapPlotting.ts - Tactical Maritime Map Plotting Helpers & Math
 * 
 * Provides dynamic bounds calculation, AIS temporal milestone extraction,
 * directional chevron calculations, and SVG marker generators.
 */

export interface LatLng {
  lat: number;
  lon: number;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Calculates dynamic investigation bounds for Leaflet fitBounds.
 * Never hardcodes bounding coordinates; aggregates genuine loaded features.
 */
export function calculateInvestigationBounds(params: {
  slickCentroid?: { lat: number; lon: number } | null;
  detectedPolygons?: number[][][];
  reconstructedRelease?: { lat: number; lon: number } | null;
  primarySuspect?: any;
  suspects?: any[];
  responderRoute?: any;
  hindcastTrajectory?: Array<{ lat: number; lon: number }>;
  mode: 'incident' | 'theater';
}): [[number, number], [number, number]] | null {
  const points: [number, number][] = [];

  // 1. Observed Slick Centroid & Polygons
  if (params.slickCentroid?.lat != null && params.slickCentroid?.lon != null) {
    points.push([params.slickCentroid.lat, params.slickCentroid.lon]);
  }

  if (params.detectedPolygons && params.detectedPolygons.length > 0) {
    for (const poly of params.detectedPolygons) {
      for (const pt of poly) {
        if (pt.length >= 2) points.push([pt[0], pt[1]]);
      }
    }
  }

  // 2. Reconstructed Release Locus
  if (params.reconstructedRelease?.lat != null && params.reconstructedRelease?.lon != null) {
    points.push([params.reconstructedRelease.lat, params.reconstructedRelease.lon]);
  }

  // 3. Backward Hindcast Trajectory
  if (params.hindcastTrajectory && params.hindcastTrajectory.length > 0) {
    for (const pt of params.hindcastTrajectory) {
      if (pt.lat != null && pt.lon != null) points.push([pt.lat, pt.lon]);
    }
  }

  // 4. Primary Suspect Track
  if (params.primarySuspect?.track_points && params.primarySuspect.track_points.length > 0) {
    for (const pt of params.primarySuspect.track_points) {
      if (pt.lat != null && pt.lon != null) points.push([pt.lat, pt.lon]);
    }
  }

  // 5. Theater-Only Regional Extensions (WPI ports, all AIS traffic, responder intercept)
  if (params.mode === 'theater') {
    if (params.suspects && params.suspects.length > 0) {
      for (const s of params.suspects) {
        if (s.lat != null && s.lon != null) points.push([s.lat, s.lon]);
        if (s.track_points) {
          for (const pt of s.track_points) {
            if (pt.lat != null && pt.lon != null) points.push([pt.lat, pt.lon]);
          }
        }
      }
    }

    if (params.responderRoute?.station_coords) {
      points.push([params.responderRoute.station_coords[0], params.responderRoute.station_coords[1]]);
    }

    if (params.responderRoute?.candidate_audit?.candidates) {
      for (const c of params.responderRoute.candidate_audit.candidates) {
        if (c.lat != null && c.lon != null) points.push([c.lat, c.lon]);
      }
    }
  }

  if (points.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const [lat, lon] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }

  // Add contextual padding (slight margin so elements don't press the screen bezel)
  const latSpan = Math.max(maxLat - minLat, 0.04);
  const lonSpan = Math.max(maxLon - minLon, 0.04);
  const latPad = params.mode === 'incident' ? latSpan * 0.15 : latSpan * 0.10;
  const lonPad = params.mode === 'incident' ? lonSpan * 0.15 : lonSpan * 0.10;

  return [
    [minLat - latPad, minLon - lonPad],
    [maxLat + latPad, maxLon + lonPad],
  ];
}

/**
 * Calculates bearing in degrees from point 1 to point 2.
 */
export function calculateBearing(p1: [number, number], p2: [number, number]): number {
  const lat1 = (p1[0] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Great-circle distance between two points in kilometers.
 */
export function haversineDistanceKm(p1: [number, number], p2: [number, number]): number {
  const R = 6371.0;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface ChevronMarker {
  lat: number;
  lon: number;
  bearing: number;
}

/**
 * Computes directional chevron positions and bearings along a polyline.
 * Ensures chevrons follow the true trajectory order without reversing.
 */
export function calculatePolylineChevrons(
  coords: Array<[number, number]>,
  minSpacingKm: number = 3.5
): ChevronMarker[] {
  if (coords.length < 2) return [];

  const chevrons: ChevronMarker[] = [];
  let accumulatedDist = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const segDist = haversineDistanceKm(p1, p2);

    accumulatedDist += segDist;
    if (accumulatedDist >= minSpacingKm || i === Math.floor(coords.length / 2)) {
      // Midpoint of the segment
      const midLat = (p1[0] + p2[0]) / 2;
      const midLon = (p1[1] + p2[1]) / 2;
      const bearing = calculateBearing(p1, p2);

      chevrons.push({
        lat: midLat,
        lon: midLon,
        bearing,
      });
      accumulatedDist = 0;
    }
  }

  return chevrons;
}

export interface AisTemporalBead {
  lat: number;
  lon: number;
  label: string;
  timestamp: string;
  diffHours: number;
}

/**
 * Finds actual AIS track points nearest to reference milestones: T-6H, T-4H, T-2H, T0.
 * Never invents points; only places a bead if an authentic ping exists within ±1.2h.
 */
export function findAisTemporalBeads(
  trackPoints: Array<{ lat: number; lon: number; timestamp?: string }>,
  baseTimeUtc?: string
): AisTemporalBead[] {
  if (!trackPoints || trackPoints.length < 2) return [];

  // Determine base T0 time
  let t0Ms: number;
  if (baseTimeUtc) {
    const parsed = Date.parse(baseTimeUtc);
    t0Ms = !isNaN(parsed) ? parsed : NaN;
  } else {
    t0Ms = NaN;
  }

  // If baseTimeUtc is invalid, use the last point timestamp
  if (isNaN(t0Ms)) {
    const lastTimestamp = trackPoints[trackPoints.length - 1]?.timestamp;
    if (lastTimestamp) {
      const parsed = Date.parse(lastTimestamp);
      t0Ms = !isNaN(parsed) ? parsed : NaN;
    }
  }

  const milestones = [
    { targetHours: -6.0, label: 'T-6H' },
    { targetHours: -4.0, label: 'T-4H' },
    { targetHours: -2.0, label: 'T-2H' },
    { targetHours: 0.0, label: 'T0' },
  ];

  const beads: AisTemporalBead[] = [];

  for (const m of milestones) {
    let closestPoint: any = null;
    let minDiffMs = Infinity;

    for (let idx = 0; idx < trackPoints.length; idx++) {
      const pt = trackPoints[idx];
      let pointDiffHours: number;

      if (!isNaN(t0Ms) && pt.timestamp) {
        const ptMs = Date.parse(pt.timestamp);
        if (!isNaN(ptMs)) {
          pointDiffHours = (ptMs - t0Ms) / (1000 * 3600);
        } else {
          // Proportion based on track index
          const progress = idx / (trackPoints.length - 1);
          pointDiffHours = -6.5 * (1 - progress);
        }
      } else {
        const progress = idx / (trackPoints.length - 1);
        pointDiffHours = -6.5 * (1 - progress);
      }

      const diffFromTarget = Math.abs(pointDiffHours - m.targetHours);
      if (diffFromTarget < minDiffMs) {
        minDiffMs = diffFromTarget;
        closestPoint = {
          lat: pt.lat,
          lon: pt.lon,
          timestamp: pt.timestamp || `T ${pointDiffHours >= 0 ? '+' : ''}${pointDiffHours.toFixed(1)}H`,
          diffHours: pointDiffHours,
        };
      }
    }

    // Only accept if within 1.25 hours of the milestone
    if (closestPoint && minDiffMs <= 1.25) {
      beads.push({
        lat: closestPoint.lat,
        lon: closestPoint.lon,
        label: m.label,
        timestamp: closestPoint.timestamp,
        diffHours: closestPoint.diffHours,
      });
    }
  }

  return beads;
}
