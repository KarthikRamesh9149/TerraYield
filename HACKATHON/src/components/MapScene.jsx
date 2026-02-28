import { useMemo, useState, useEffect, useCallback } from 'react'
import Map, { NavigationControl } from 'react-map-gl/maplibre'
import DeckGL from '@deck.gl/react'
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers'
import { fetchHotspots } from '../services/hotspotsApi'
import { fetchAllIndiaBoundaries, buildDistrictLabels } from '../services/indiaBoundariesApi'
import { Sidebar } from './Sidebar'
import { Legend } from './Legend'
import { Tooltip } from './Tooltip'
import 'maplibre-gl/dist/maplibre-gl.css'

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

// India center
const INITIAL_VIEW_STATE = {
  longitude: 78.0,
  latitude: 21.0,
  zoom: 4,
  pitch: 0,
  bearing: 0
}

// Soil: low=green/transparent, high=red
function getSoilColor(feature) {
  const score = feature.properties?.soil_risk_score ?? 0
  if (score < 0.34) return [0, 128, 0, 80]
  if (score < 0.67) return [255, 255, 0, 130]
  return [255, 0, 0, 180]
}

// Yield: decreasing=red, flat=yellow, increasing=green
function getYieldColor(feature) {
  const trend = (feature.properties?.yield_trend || 'zero').toLowerCase()
  if (trend === 'negative') return [255, 0, 0, 180]
  if (trend === 'zero') return [255, 255, 0, 150]
  return [0, 128, 0, 150]
}

export default function MapScene() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [hotspots, setHotspots] = useState(null)
  const [boundaries, setBoundaries] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    fetchAllIndiaBoundaries()
      .then(setBoundaries)
      .catch((err) => console.error('Failed to load India boundaries:', err))
  }, [])

  useEffect(() => {
    fetchHotspots({ issue: selectedIssue })
      .then(setHotspots)
      .catch((err) => console.error('Failed to load hotspots:', err))
  }, [selectedIssue])

  const hoveredBoundaryIndex = hovered?.layer?.id === 'india-boundaries' ? hovered.index : null

  const layers = useMemo(() => {
    const result = []

    // India regions/districts layer - subtle by default, highlighted on hover
    if (boundaries?.features?.length) {
      result.push(
        new GeoJsonLayer({
          id: 'india-boundaries',
          data: boundaries,
          pickable: true,
          filled: true,
          stroked: true,
          getFillColor: (f, info) =>
            info.index === hoveredBoundaryIndex ? [255, 255, 255, 35] : [255, 255, 255, 12],
          getLineColor: (f, info) =>
            info.index === hoveredBoundaryIndex ? [255, 255, 255, 220] : [255, 255, 255, 55],
          getLineWidth: (f, info) => (info.index === hoveredBoundaryIndex ? 2.5 : 0.8),
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 0.5,
          lineWidthMaxPixels: 4
        })
      )

      // District numbers (Dist_Code) as semi-transparent labels at centroid
      const labels = buildDistrictLabels(boundaries)
      if (labels.length) {
        result.push(
          new TextLayer({
            id: 'district-labels',
            data: labels,
            getPosition: (d) => d.position,
            getText: (d) => d.text,
            getSize: 14,
            getColor: [255, 255, 255, 90],
            fontFamily: 'Outfit, system-ui, sans-serif',
            fontWeight: 500,
            sizeUnits: 'pixels',
            sizeMinPixels: 10,
            sizeMaxPixels: 24,
            pickable: false
          })
        )
      }
    }

    // Hotspots overlay - only when filter selected
    if (hotspots?.features?.length && selectedIssue) {
      const getFillColor = selectedIssue === 'soil' ? getSoilColor : getYieldColor
      result.push(
        new GeoJsonLayer({
          id: 'hotspots-layer',
          data: hotspots,
          pickable: true,
          filled: true,
          stroked: true,
          getFillColor,
          getLineColor: [255, 255, 255, 120],
          lineWidthMinPixels: 1
        })
      )
    }

    return result
  }, [boundaries, hotspots, selectedIssue, hoveredBoundaryIndex])

  const handleHover = useCallback((info) => {
    setHovered(info)
    if (info.x != null && info.y != null) {
      setTooltipPos({ x: info.x, y: info.y })
    }
  }, [])

  return (
    <div className="map-layout">
      <Sidebar selectedIssue={selectedIssue} onSelectIssue={setSelectedIssue} />

      <div className="map-container">
        <DeckGL
          viewState={viewState}
          onViewStateChange={({ viewState: vs }) => setViewState(vs)}
          controller={true}
          layers={layers}
          getCursor={() => (hovered ? 'pointer' : 'grab')}
          onHover={handleHover}
        >
          <Map mapStyle={DARK_STYLE} attributionControl={false}>
            <NavigationControl position="top-right" showCompass showZoom />
          </Map>
        </DeckGL>

        <div className="legend-container">
          <Legend issue={selectedIssue} />
        </div>

        <Tooltip hovered={hovered} x={tooltipPos.x} y={tooltipPos.y} />
      </div>
    </div>
  )
}
