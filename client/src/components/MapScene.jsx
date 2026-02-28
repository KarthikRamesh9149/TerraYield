import { useState, useEffect, useCallback, useMemo } from 'react';
import MapLibreMap from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';

import Sidebar from './Sidebar';
import Legend from './Legend';
import Tooltip from './Tooltip';
import RightPanel from './RightPanel';
import { INITIAL_VIEW_STATE, MAP_STYLE, COLORS, LAYER_IDS } from '../constants/mapConfig';
import {
  fetchAllIndiaBoundaries,
  buildDistrictLabels,
  getFeatureBounds,
  getPolygonCentroid,
} from '../utils/indiaBoundariesApi';
import { fetchHotspots, getSoilColor, getYieldColor } from '../utils/hotspotsApi';
import { fetchDegradationLookup } from '../utils/districtsDegradationApi';

function MapScene() {
  // Map view state
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  // Selected issue type: 'soil' | 'yield' | null
  const [selectedIssue, setSelectedIssue] = useState(null);

  // GeoJSON data
  const [boundaries, setBoundaries] = useState(null);
  const [hotspots, setHotspots] = useState(null);
  const [degradationLookup, setDegradationLookup] = useState(() => new Map());

  // Hover state
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Selected district for right panel
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Show all district colors (true) or only highlight hovered district (false)
  const [showAllColors, setShowAllColors] = useState(true);

  // Load India boundaries on mount
  useEffect(() => {
    fetchAllIndiaBoundaries()
      .then(setBoundaries)
      .catch((err) => console.error('Failed to load India boundaries:', err));
  }, []);

  // Load degradation/risk lookup for district coloring
  useEffect(() => {
    fetchDegradationLookup()
      .then(setDegradationLookup)
      .catch(() => setDegradationLookup(new Map()));
  }, []);

  // Load hotspots when selectedIssue changes
  useEffect(() => {
    async function loadHotspots() {
      if (selectedIssue) {
        const data = await fetchHotspots({ issue: selectedIssue });
        setHotspots(data);
      } else {
        setHotspots(null);
      }
    }
    loadHotspots();
  }, [selectedIssue]);

  // Build district labels from boundaries (Dist_Code at centroids)
  const districtLabels = useMemo(() => {
    return boundaries ? buildDistrictLabels(boundaries) : [];
  }, [boundaries]);

  // Districts list for sidebar search
  const districts = useMemo(
    () => (boundaries?.features ?? []).map((feature) => ({ feature })),
    [boundaries]
  );

  // Hovered district index for highlight
  const hoveredBoundaryIndex =
    hoveredFeature?.type === 'boundary' ? hoveredFeature.index : null;

  // Zoom to selected district
  const handleDistrictSelect = useCallback((feature) => {
    if (!feature?.geometry) return;
    const bounds = getFeatureBounds(feature.geometry);
    if (bounds) {
      const [minLng, minLat, maxLng, maxLat] = bounds;
      const centerLng = (minLng + maxLng) / 2;
      const centerLat = (minLat + maxLat) / 2;
      const width = maxLng - minLng;
      const height = maxLat - minLat;
      const span = Math.max(width, height, 0.1);
      const zoom = Math.min(12, Math.max(6, 10 - Math.log2(span * 2)));
      setViewState((prev) => ({
        ...prev,
        longitude: centerLng,
        latitude: centerLat,
        zoom,
      }));
    } else {
      const centroid = getPolygonCentroid(feature.geometry);
      if (centroid) {
        setViewState((prev) => ({
          ...prev,
          longitude: centroid[0],
          latitude: centroid[1],
          zoom: 9,
        }));
      }
    }
  }, []);

  // Handle view state change
  const handleViewStateChange = useCallback(({ viewState: newViewState }) => {
    setViewState(newViewState);
  }, []);

  // Handle issue toggle
  const handleIssueChange = useCallback((issue) => {
    setSelectedIssue((current) => (current === issue ? null : issue));
  }, []);

  // Handle boundary hover (store index for highlight)
  const handleBoundaryHover = useCallback((info) => {
    if (info.object) {
      const p = info.object.properties || {};
      const key = `${p.State_Name ?? p.state}|${p.Dist_Name ?? p.district}`;
      const degradation = degradationLookup.get(key);
      setHoveredFeature({
        type: 'boundary',
        properties: { ...p, degradation_level: degradation },
        index: info.index,
      });
      setTooltipPosition({ x: info.x, y: info.y });
    } else if (hoveredFeature?.type === 'boundary') {
      setHoveredFeature(null);
    }
  }, [hoveredFeature, degradationLookup]);

  // Handle hotspot hover
  const handleHotspotHover = useCallback((info) => {
    if (info.object) {
      setHoveredFeature({
        type: 'hotspot',
        properties: info.object.properties,
        issue: selectedIssue,
      });
      setTooltipPosition({ x: info.x, y: info.y });
    } else if (hoveredFeature?.type === 'hotspot') {
      setHoveredFeature(null);
    }
  }, [hoveredFeature, selectedIssue]);

  // Handle hotspot click - open right panel
  const handleHotspotClick = useCallback((info) => {
    if (info.object && info.object.properties) {
      const districtId = info.object.properties.district_id;
      if (districtId) {
        setSelectedDistrict(districtId);
      }
    }
  }, []);

  // Close the right panel
  const handleClosePanel = useCallback(() => {
    setSelectedDistrict(null);
  }, []);

  // Get color for hotspot based on selected issue
  const getHotspotColor = useCallback((feature) => {
    const props = feature.properties;
    if (selectedIssue === 'soil') {
      return getSoilColor(props.soil_risk_score);
    }
    if (selectedIssue === 'yield') {
      return getYieldColor(props.yield_trend);
    }
    return COLORS.unknown;
  }, [selectedIssue]);

  // Get fill color for a district by risk level (low=green, medium=orange, high=red)
  const getDegradationColor = useCallback((level) => {
    const l = (level || '').toLowerCase();
    if (l === 'low') return COLORS.lowRisk;
    if (l === 'medium') return COLORS.mediumRisk;
    if (l === 'high') return COLORS.highRisk;
    if (l === 'severe') return COLORS.severeRisk;
    return COLORS.unknown;
  }, []);

  // Build layers - hotspots first (underneath), then districts (filled by risk), then labels
  const layers = useMemo(() => {
    const layerList = [];

    // Hotspots layer first (only when issue is selected) - drawn underneath districts
    if (selectedIssue && hotspots) {
      layerList.push(
        new GeoJsonLayer({
          id: LAYER_IDS.hotspots,
          data: hotspots,
          stroked: true,
          filled: true,
          lineWidthMinPixels: 2,
          getFillColor: (feature) => getHotspotColor(feature),
          getLineColor: COLORS.hotspotLine,
          pickable: true,
          onHover: handleHotspotHover,
          onClick: handleHotspotClick,
          updateTriggers: {
            getFillColor: [selectedIssue],
          },
        })
      );
    }

    // India boundaries - FILL each district area with risk color (green/orange/red)
    if (boundaries) {
      layerList.push(
        new GeoJsonLayer({
          id: LAYER_IDS.boundaries,
          data: boundaries,
          stroked: true,
          filled: true,
          getFillColor: (f, info) => {
            const idx = info?.index ?? f?.__source?.index;
            const isHovered = idx === hoveredBoundaryIndex;
            if (isHovered) {
              const stateName = f?.properties?.State_Name ?? f?.properties?.state ?? '';
              const distName = f?.properties?.Dist_Name ?? f?.properties?.district ?? '';
              const key = `${stateName}|${distName}`;
              const level = degradationLookup.get(key);
              return getDegradationColor(level);
            }
            if (!showAllColors) return COLORS.boundaryFillNeutral;
            const stateName = f?.properties?.State_Name ?? f?.properties?.state ?? '';
            const distName = f?.properties?.Dist_Name ?? f?.properties?.district ?? '';
            const key = `${stateName}|${distName}`;
            const level = degradationLookup.get(key);
            return getDegradationColor(level);
          },
          getLineColor: (f, info) => {
            const idx = info?.index ?? f?.__source?.index;
            const isHovered = idx === hoveredBoundaryIndex;
            return isHovered ? [255, 255, 220, 255] : [255, 255, 255, 100];
          },
          getLineWidth: (f, info) => {
            const idx = info?.index ?? f?.__source?.index;
            const isHovered = idx === hoveredBoundaryIndex;
            return isHovered ? 4 : 1;
          },
          lineWidthUnits: 'pixels',
          lineWidthMinPixels: 1,
          lineWidthMaxPixels: 6,
          pickable: true,
          onHover: handleBoundaryHover,
          updateTriggers: {
            getFillColor: [showAllColors, hoveredBoundaryIndex],
          },
        })
      );

      // District labels layer (Dist_Code at centroids)
      if (districtLabels.length) {
        layerList.push(
          new TextLayer({
            id: LAYER_IDS.labels,
            data: districtLabels,
            getPosition: (d) => d.position,
            getText: (d) => d.text,
            getSize: 14,
            getColor: COLORS.labelText,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 500,
            getTextAnchor: 'middle',
            getAlignmentBaseline: 'center',
            billboard: false,
          })
        );
      }
    }

    return layerList;
  }, [
    boundaries,
    districtLabels,
    hotspots,
    selectedIssue,
    hoveredBoundaryIndex,
    showAllColors,
    degradationLookup,
    getDegradationColor,
    getHotspotColor,
    handleBoundaryHover,
    handleHotspotHover,
    handleHotspotClick,
  ]);

  // Cursor style based on hover state
  const isOverDistrict = hoveredFeature?.type === 'boundary';
  const getCursor = useCallback(({ isDragging }) => {
    if (isDragging) return 'grabbing';
    if (hoveredFeature) return 'pointer';
    return 'grab';
  }, [hoveredFeature]);

  return (
    <div className="map-scene">
      <Sidebar
        selectedIssue={selectedIssue}
        onIssueChange={handleIssueChange}
        selectedDistrict={selectedDistrict}
        onDistrictSelect={setSelectedDistrict}
        districts={districts}
        onDistrictSearchSelect={handleDistrictSelect}
        showAllColors={showAllColors}
        onShowAllColorsChange={setShowAllColors}
      />

      <div className={`map-container ${selectedDistrict ? 'panel-open' : ''}`}>
        <DeckGL
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          controller={true}
          layers={layers}
          getCursor={getCursor}
        >
          <MapLibreMap mapStyle={MAP_STYLE} />
        </DeckGL>

        <Legend selectedIssue={selectedIssue} />

        {hoveredFeature && (
          <Tooltip
            feature={hoveredFeature}
            position={tooltipPosition}
          />
        )}
      </div>

      {selectedDistrict && (
        <RightPanel
          districtId={selectedDistrict}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}

export default MapScene;
