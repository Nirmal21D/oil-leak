/**
 * Geospatial Formatting Utilities
 * Provides hemisphere-aware, RFC-compliant coordinate strings and neutral labels.
 */

export function formatCoordinate(lat?: number | null, lon?: number | null): string {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return 'STANDBY // AWAITING SENSOR INGEST';
  }

  const latStr = lat >= 0 ? `${lat.toFixed(4)}° N` : `${Math.abs(lat).toFixed(4)}° S`;
  const lonStr = lon >= 0 ? `${lon.toFixed(4)}° E` : `${Math.abs(lon).toFixed(4)}° W`;

  return `${latStr}, ${lonStr}`;
}

export function formatCoordinateShort(lat?: number | null, lon?: number | null): string {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return 'STANDBY';
  }

  const latStr = lat >= 0 ? `${lat.toFixed(2)}°N` : `${Math.abs(lat).toFixed(2)}°S`;
  const lonStr = lon >= 0 ? `${lon.toFixed(2)}°E` : `${Math.abs(lon).toFixed(2)}°W`;

  return `${latStr}, ${lonStr}`;
}

export function deriveSectorLabel(lat?: number | null, lon?: number | null): string {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return 'STANDBY // AWAITING SENSOR INGEST';
  }

  return `OFFSHORE SECTOR // ${formatCoordinate(lat, lon)}`;
}

export function deriveIncidentTitle(lat?: number | null, lon?: number | null): string {
  if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
    return 'STANDBY // AWAITING SENSOR INGEST';
  }

  return `OFFSHORE OIL SPILL // ${formatCoordinate(lat, lon)}`;
}

/**
 * Ensures any base64 image or data URL is formatted properly for an <img> or ImageOverlay src.
 * Prevents raw base64 strings from being treated as relative server paths (causing 404s),
 * and prevents double 'data:image/png;base64,' prefixes.
 */
export function formatDataUrl(src?: string | null): string {
  if (!src) return '';
  const trimmed = src.trim();
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  return `data:image/png;base64,${trimmed}`;
}

