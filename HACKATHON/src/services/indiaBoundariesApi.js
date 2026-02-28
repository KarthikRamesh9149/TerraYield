/**
 * Loads India state and district boundaries from GeoJSON files.
 * Each state file contains districts as features with State_Name, Dist_Name, etc.
 */

const MANIFEST_URL = '/india/manifest.json'
const BASE_URL = '/india'

/**
 * @returns {Promise<string[]>} List of state slugs (filenames without .geojson)
 */
async function getStateList() {
  const res = await fetch(MANIFEST_URL)
  if (!res.ok) throw new Error('Failed to load India manifest')
  return res.json()
}

/**
 * @param {string} slug - State slug (e.g. "punjab", "uttarpradesh")
 * @returns {Promise<GeoJSON.FeatureCollection>}
 */
async function fetchState(slug) {
  const res = await fetch(`${BASE_URL}/${slug}.geojson`)
  if (!res.ok) throw new Error(`Failed to load ${slug}`)
  return res.json()
}

/**
 * Compute centroid of a Polygon or MultiPolygon for label placement.
 * @param {object} geometry - GeoJSON geometry
 * @returns {[number, number]|null} [lng, lat] or null
 */
export function getPolygonCentroid(geometry) {
  if (!geometry?.coordinates) return null
  const coords = geometry.coordinates
  let ring

  if (geometry.type === 'Polygon') {
    ring = coords[0]
  } else if (geometry.type === 'MultiPolygon') {
    ring = coords[0]?.[0]
  } else {
    return null
  }

  if (!ring || ring.length < 2) return null
  let sumLng = 0
  let sumLat = 0
  const n = ring.length - (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? 1 : 0)
  for (let i = 0; i < n; i++) {
    sumLng += ring[i][0]
    sumLat += ring[i][1]
  }
  return [sumLng / n, sumLat / n]
}

/**
 * Build label data for TextLayer from boundaries FeatureCollection.
 * @param {GeoJSON.FeatureCollection} fc
 * @returns {Array<{position: [number,number], text: string, index: number}>}
 */
export function buildDistrictLabels(fc) {
  if (!fc?.features) return []
  return fc.features
    .map((f, i) => {
      const centroid = getPolygonCentroid(f.geometry)
      const code = f.properties?.Dist_Code ?? f.properties?.dist_code ?? String(i + 1)
      if (!centroid) return null
      return { position: centroid, text: String(code), index: i }
    })
    .filter(Boolean)
}

/**
 * Loads all state boundaries and merges into a single FeatureCollection.
 * Each feature has properties: State_Name, Dist_Name, state, etc.
 * @returns {Promise<GeoJSON.FeatureCollection>}
 */
export async function fetchAllIndiaBoundaries() {
  const slugs = await getStateList()
  const collections = await Promise.all(
    slugs.map((slug) => fetchState(slug))
  )

  const allFeatures = []
  for (const fc of collections) {
    if (fc?.type === 'FeatureCollection' && Array.isArray(fc.features)) {
      for (const f of fc.features) {
        if (f?.type === 'Feature' && f.geometry) {
          allFeatures.push(f)
        }
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features: allFeatures
  }
}
