/**
 * Loads India state and district boundaries from GeoJSON files.
 * Each state file contains districts as features with State_Name, Dist_Name, Dist_Code, etc.
 * Supports manifest as array of slugs or { states: [{ slug, file }] }.
 */

const MANIFEST_URL = '/india/manifest.json';
const BASE_URL = '/india';

/**
 * @returns {Promise<string[]>} List of state slugs (filenames without .geojson)
 */
async function getStateList() {
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error('Failed to load India manifest');
  const data = await res.json();
  // Support both array of slugs and { states: [{ slug, file }] }
  if (Array.isArray(data)) return data;
  if (data?.states && Array.isArray(data.states)) {
    return data.states.map((s) => s.slug || (s.file && s.file.replace(/\.geojson$/, '')) || s.name?.toLowerCase().replace(/\s+/g, ''));
  }
  return [];
}

/**
 * @param {string} slug - State slug (e.g. "punjab", "uttarpradesh")
 * @returns {Promise<GeoJSON.FeatureCollection>}
 */
async function fetchState(slug) {
  const res = await fetch(`${BASE_URL}/${slug}.geojson`);
  if (!res.ok) throw new Error(`Failed to load ${slug}`);
  return res.json();
}

/**
 * Compute bounding box [minLng, minLat, maxLng, maxLat] of a Polygon or MultiPolygon.
 * @param {object} geometry - GeoJSON geometry
 * @returns {[number, number, number, number]|null} [minLng, minLat, maxLng, maxLat] or null
 */
export function getFeatureBounds(geometry) {
  if (!geometry?.coordinates) return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

  function processRing(ring) {
    for (const [lng, lat] of ring) {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    }
  }

  const coords = geometry.coordinates;
  if (geometry.type === 'Polygon') {
    coords.forEach(processRing);
  } else if (geometry.type === 'MultiPolygon') {
    coords.forEach((poly) => poly.forEach(processRing));
  } else {
    return null;
  }

  if (minLng === Infinity) return null;
  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Compute centroid of a Polygon or MultiPolygon for label placement.
 * @param {object} geometry - GeoJSON geometry
 * @returns {[number, number]|null} [lng, lat] or null
 */
export function getPolygonCentroid(geometry) {
  if (!geometry?.coordinates) return null;
  const coords = geometry.coordinates;
  let ring;

  if (geometry.type === 'Polygon') {
    ring = coords[0];
  } else if (geometry.type === 'MultiPolygon') {
    ring = coords[0]?.[0];
  } else {
    return null;
  }

  if (!ring || ring.length < 2) return null;
  let sumLng = 0;
  let sumLat = 0;
  const n = ring.length - (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? 1 : 0);
  for (let i = 0; i < n; i++) {
    sumLng += ring[i][0];
    sumLat += ring[i][1];
  }
  return [sumLng / n, sumLat / n];
}

/**
 * Build label data for TextLayer from boundaries FeatureCollection.
 * Uses Dist_Code when available, otherwise dist_code or index.
 * @param {GeoJSON.FeatureCollection} fc
 * @returns {Array<{position: [number,number], text: string, index: number}>}
 */
export function buildDistrictLabels(fc) {
  if (!fc?.features) return [];
  return fc.features
    .map((f, i) => {
      const centroid = getPolygonCentroid(f.geometry);
      const code = f.properties?.Dist_Code ?? f.properties?.dist_code ?? f.properties?.name ?? String(i + 1);
      if (!centroid) return null;
      return { position: centroid, text: String(code), index: i };
    })
    .filter(Boolean);
}

/**
 * Loads all state boundaries and merges into a single FeatureCollection.
 * Each feature has properties: State_Name, Dist_Name, Dist_Code, etc.
 * @returns {Promise<GeoJSON.FeatureCollection>}
 */
export async function fetchAllIndiaBoundaries() {
  let slugs = [];
  try {
    slugs = await getStateList();
  } catch (err) {
    console.error('Failed to load India manifest:', err);
    return { type: 'FeatureCollection', features: [] };
  }

  const results = await Promise.allSettled(
    slugs.map((slug) => fetchState(slug))
  );

  const allFeatures = [];
  for (const result of results) {
    if (result.status !== 'fulfilled') {
      console.warn('State fetch failed:', result.reason?.message);
      continue;
    }
    const fc = result.value;
    if (fc?.type === 'FeatureCollection' && Array.isArray(fc.features)) {
      for (const f of fc.features) {
        if (f?.type === 'Feature' && f.geometry) {
          allFeatures.push(f);
        }
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features: allFeatures,
  };
}

/**
 * Alias for backward compatibility with loadIndiaBoundaries
 */
export const loadIndiaBoundaries = fetchAllIndiaBoundaries;
