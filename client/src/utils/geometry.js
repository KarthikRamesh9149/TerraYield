/**
 * Geometry utility functions for map visualization
 */

/**
 * Calculate the centroid of a polygon
 * @param {number[][][]} coordinates - GeoJSON polygon coordinates
 * @returns {[number, number]} - [longitude, latitude]
 */
export function getPolygonCentroid(coordinates) {
  // Use the first ring (exterior ring) of the polygon
  const ring = coordinates[0];

  if (!ring || ring.length === 0) {
    return [0, 0];
  }

  let sumX = 0;
  let sumY = 0;
  let area = 0;

  for (let i = 0; i < ring.length - 1; i++) {
    const x0 = ring[i][0];
    const y0 = ring[i][1];
    const x1 = ring[i + 1][0];
    const y1 = ring[i + 1][1];

    const crossProduct = x0 * y1 - x1 * y0;
    area += crossProduct;
    sumX += (x0 + x1) * crossProduct;
    sumY += (y0 + y1) * crossProduct;
  }

  area /= 2;

  if (Math.abs(area) < 1e-10) {
    // Fallback: simple average of points
    const avgX = ring.reduce((sum, p) => sum + p[0], 0) / ring.length;
    const avgY = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
    return [avgX, avgY];
  }

  const cx = sumX / (6 * area);
  const cy = sumY / (6 * area);

  return [cx, cy];
}

/**
 * Calculate centroid for any GeoJSON geometry
 * @param {object} geometry - GeoJSON geometry object
 * @returns {[number, number]} - [longitude, latitude]
 */
export function getGeometryCentroid(geometry) {
  if (!geometry) return [0, 0];

  switch (geometry.type) {
    case 'Point':
      return geometry.coordinates;

    case 'Polygon':
      return getPolygonCentroid(geometry.coordinates);

    case 'MultiPolygon':
      // Find the largest polygon and use its centroid
      let maxArea = 0;
      let centroid = [0, 0];

      for (const polygon of geometry.coordinates) {
        const ring = polygon[0];
        let area = 0;
        for (let i = 0; i < ring.length - 1; i++) {
          area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
        }
        area = Math.abs(area / 2);

        if (area > maxArea) {
          maxArea = area;
          centroid = getPolygonCentroid(polygon);
        }
      }
      return centroid;

    default:
      return [0, 0];
  }
}

/**
 * Build district labels from boundaries GeoJSON
 * @param {object} boundaries - GeoJSON FeatureCollection
 * @returns {Array<{coordinates: [number, number], name: string, state_code: string}>}
 */
export function buildDistrictLabels(boundaries) {
  if (!boundaries || !boundaries.features) {
    return [];
  }

  return boundaries.features.map((feature) => {
    const centroid = getGeometryCentroid(feature.geometry);
    return {
      coordinates: centroid,
      name: feature.properties.name || 'Unknown',
      state_code: feature.properties.state_code || '',
    };
  });
}

/**
 * Calculate bounding box from viewState
 * @param {object} viewState - Map view state with longitude, latitude, zoom
 * @returns {{minLng: number, minLat: number, maxLng: number, maxLat: number}}
 */
export function getBboxFromViewState(viewState) {
  const { longitude, latitude, zoom } = viewState;

  // Approximate degrees visible based on zoom level
  // At zoom 0, ~360 degrees visible; at zoom 10, ~0.35 degrees
  const degreesVisible = 360 / Math.pow(2, zoom);
  const halfDegrees = degreesVisible / 2;

  return {
    minLng: longitude - halfDegrees,
    minLat: latitude - halfDegrees * 0.75, // Adjust for aspect ratio
    maxLng: longitude + halfDegrees,
    maxLat: latitude + halfDegrees * 0.75,
  };
}
