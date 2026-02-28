/**
 * Map configuration constants
 */

// Initial view state centered on India
export const INITIAL_VIEW_STATE = {
  longitude: 78.9629,
  latitude: 20.5937,
  zoom: 4.5,
  pitch: 0,
  bearing: 0,
  minZoom: 3,
  maxZoom: 12,
};

// Carto Dark Matter basemap style
export const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Layer colors
export const COLORS = {
  // Boundaries
  boundaryFill: [30, 30, 40, 100],
  boundaryLine: [100, 100, 120, 255],

  // Risk levels
  lowRisk: [76, 175, 80, 200],      // Green
  mediumRisk: [255, 193, 7, 200],   // Yellow/Amber
  highRisk: [244, 67, 54, 200],     // Red
  unknown: [128, 128, 128, 200],    // Gray

  // Hotspot hover
  hotspotHover: [255, 255, 255, 255],
  hotspotLine: [255, 255, 255, 150],

  // Labels
  labelText: [255, 255, 255, 200],
};

// Layer IDs
export const LAYER_IDS = {
  boundaries: 'india-boundaries',
  labels: 'district-labels',
  hotspots: 'hotspots',
};

// Issue types
export const ISSUE_TYPES = {
  SOIL: 'soil',
  YIELD: 'yield',
};
