/**
 * Hotspots API - fetches GeoJSON FeatureCollection of grid cells.
 * Stubbed with local static file; structure ready for real API:
 * GET /api/hotspots?bbox=&zoom=&issue=soil|yield
 */
/** Set true to call real backend; false uses stub (static file or Vite proxy) */
const USE_REAL_API = false
const API_BASE = '/api'
const STUB_URL = '/hotspots.geojson'

/**
 * GET /api/hotspots?bbox=&zoom=&issue=soil|yield
 * Returns GeoJSON FeatureCollection with soil_risk_score, yield_trend, name
 * @param {Object} params
 * @param {string} [params.bbox] - bbox string (minLng,minLat,maxLng,maxLat)
 * @param {number} [params.zoom] - map zoom level
 * @param {'soil'|'yield'} [params.issue] - filter by issue type
 * @returns {Promise<GeoJSON.FeatureCollection>}
 */
export async function fetchHotspots({ bbox, zoom, issue } = {}) {
  const qs = new URLSearchParams()
  if (bbox) qs.set('bbox', bbox)
  if (zoom != null) qs.set('zoom', String(zoom))
  if (issue) qs.set('issue', issue)

  if (USE_REAL_API) {
    const res = await fetch(`${API_BASE}/hotspots?${qs}`)
    if (!res.ok) throw new Error(`Hotspots API error: ${res.status}`)
    return res.json()
  }

  // Stub: fetch static GeoJSON from public folder (or use Vite proxy /api/hotspots -> /hotspots.geojson)
  const res = await fetch(STUB_URL)
  if (!res.ok) throw new Error(`Failed to load hotspots: ${res.status}`)
  const data = await res.json()

  // Client-side filter by issue if needed (real API would filter server-side)
  if (issue && data.features) {
    data.features = data.features.filter((f) => {
      const p = f.properties || {}
      if (issue === 'soil') return p.soil_risk_score != null
      if (issue === 'yield') return p.yield_trend != null
      return true
    })
  }
  return data
}
