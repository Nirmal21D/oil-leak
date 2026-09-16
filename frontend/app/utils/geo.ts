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
