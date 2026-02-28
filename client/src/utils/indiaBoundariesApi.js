/**
 * India Boundaries API utilities
 * Handles loading and merging India state boundary GeoJSON files
 */

/**
 * Load India state boundaries from manifest and merge into single FeatureCollection
 * @returns {Promise<object>} - Merged GeoJSON FeatureCollection
 */
export async function loadIndiaBoundaries() {
  try {
    // Load the manifest
    const manifestResponse = await fetch('/india/manifest.json');

    if (!manifestResponse.ok) {
      throw new Error(`Failed to load manifest: ${manifestResponse.status}`);
    }

    const manifest = await manifestResponse.json();

    // Load all state GeoJSON files in parallel
    const statePromises = manifest.states.map(async (state) => {
      try {
        const response = await fetch(`/india/${state.file}`);

        if (!response.ok) {
          console.warn(`Failed to load state ${state.name}: ${response.status}`);
          return null;
        }

        return await response.json();
      } catch (error) {
        console.warn(`Error loading state ${state.name}:`, error);
        return null;
      }
    });

    const stateGeoJsons = await Promise.all(statePromises);

    // Merge all features into a single FeatureCollection
    const mergedFeatures = stateGeoJsons
      .filter((geojson) => geojson !== null)
      .flatMap((geojson) => geojson.features || []);

    return {
      type: 'FeatureCollection',
      features: mergedFeatures,
    };
  } catch (error) {
    console.error('Error loading India boundaries:', error);
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Load a single state boundary by slug
 * @param {string} slug - State slug (e.g., 'maharashtra')
 * @returns {Promise<object|null>} - GeoJSON FeatureCollection or null
 */
export async function loadStateBoundary(slug) {
  try {
    const response = await fetch(`/india/${slug}.geojson`);

    if (!response.ok) {
      throw new Error(`Failed to load state ${slug}: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error loading state ${slug}:`, error);
    return null;
  }
}
