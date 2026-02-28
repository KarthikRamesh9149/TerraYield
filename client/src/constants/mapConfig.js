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
  boundaryFillNeutral: [50, 50, 55, 80],  // Subtle fill when "Show All" is off (non-hovered)
  boundaryLine: [100, 100, 120, 255],

  // Risk levels - opaque fills so district areas are clearly visible
  lowRisk: [76, 175, 80, 230],      // Green
  mediumRisk: [255, 140, 0, 230],   // Orange
  highRisk: [244, 67, 54, 230],     // Red
  severeRisk: [139, 0, 0, 220],    // Dark red
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
