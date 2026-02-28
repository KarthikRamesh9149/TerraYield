/**
 * Hotspots API utilities
 * Handles fetching hotspot data from either local GeoJSON or API endpoint
 */

// Toggle for using real API vs local stub data
export const USE_REAL_API = false;

/**
 * Fetch hotspots data
 * @param {object} options - Fetch options
 * @param {object} options.bbox - Bounding box {minLng, minLat, maxLng, maxLat}
 * @param {number} options.zoom - Current zoom level
 * @param {string} options.issue - Issue type ('soil' | 'yield' | null)
 * @returns {Promise<object>} - GeoJSON FeatureCollection
 */
export async function fetchHotspots({ bbox, zoom, issue } = {}) {
  if (USE_REAL_API) {
    return fetchHotspotsFromApi({ bbox, zoom, issue });
  }
  return fetchHotspotsFromStub({ issue });
}

/**
 * Fetch hotspots from local GeoJSON stub
 * @param {object} options - Fetch options
 * @param {string} options.issue - Issue type for filtering
 * @returns {Promise<object>} - GeoJSON FeatureCollection
 */
async function fetchHotspotsFromStub({ issue }) {
  try {
    const response = await fetch('/hotspots.geojson');

    if (!response.ok) {
      throw new Error(`Failed to fetch hotspots: ${response.status}`);
    }

    const data = await response.json();

    // If no issue selected, return all features
    if (!issue) {
      return data;
    }

    // Client-side filtering based on issue type
    // For now, return all features as they contain both soil and yield data
    return data;
  } catch (error) {
    console.error('Error fetching hotspots from stub:', error);
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Fetch hotspots from API endpoint
 * @param {object} options - Fetch options
 * @param {object} options.bbox - Bounding box
 * @param {number} options.zoom - Zoom level
 * @param {string} options.issue - Issue type
 * @returns {Promise<object>} - GeoJSON FeatureCollection
 */
async function fetchHotspotsFromApi({ bbox, zoom, issue }) {
  try {
    const params = new URLSearchParams();

    if (issue) {
      params.append('issue', issue);
    }

    if (bbox) {
      params.append('bbox', `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`);
    }

    if (zoom !== undefined) {
      params.append('zoom', String(zoom));
    }

    const queryString = params.toString();
    const url = `/api/hotspots${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching hotspots from API:', error);
    // Fallback to stub data on API error
    return fetchHotspotsFromStub({ issue });
  }
}

/**
 * Get the color for soil risk score
 * @param {number} soilRiskScore - Risk score from 0 to 1
 * @returns {[number, number, number, number]} - RGBA color array
 */
export function getSoilColor(soilRiskScore) {
  // Green (low risk) -> Yellow -> Red (high risk)
  if (soilRiskScore < 0.3) {
    return [76, 175, 80, 200]; // Green
  }
  if (soilRiskScore < 0.6) {
    return [255, 193, 7, 200]; // Yellow/Amber
  }
  return [244, 67, 54, 200]; // Red
}

/**
 * Get the color for yield trend
 * @param {string} yieldTrend - Trend: 'increasing' | 'flat' | 'decreasing'
 * @returns {[number, number, number, number]} - RGBA color array
 */
export function getYieldColor(yieldTrend) {
  switch (yieldTrend) {
    case 'increasing':
      return [76, 175, 80, 200]; // Green
    case 'flat':
      return [255, 193, 7, 200]; // Yellow/Amber
    case 'decreasing':
      return [244, 67, 54, 200]; // Red
    default:
      return [128, 128, 128, 200]; // Gray for unknown
  }
}
