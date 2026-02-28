import { useState, useEffect, useCallback, useMemo } from 'react';
import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, TextLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';

import Sidebar from './Sidebar';
import Legend from './Legend';
import Tooltip from './Tooltip';
import RightPanel from './RightPanel';
import { INITIAL_VIEW_STATE, MAP_STYLE, COLORS, LAYER_IDS } from '../constants/mapConfig';
import { loadIndiaBoundaries } from '../utils/indiaBoundariesApi';
import { fetchHotspots, getSoilColor, getYieldColor } from '../utils/hotspotsApi';
import { buildDistrictLabels } from '../utils/geometry';

function MapScene() {
  // Map view state
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  // Selected issue type: 'soil' | 'yield' | null
  const [selectedIssue, setSelectedIssue] = useState(null);

  // GeoJSON data
  const [boundaries, setBoundaries] = useState(null);
  const [hotspots, setHotspots] = useState(null);

  // Hover state
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Selected district for right panel
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Load India boundaries on mount
  useEffect(() => {
    async function loadBoundaries() {
      const data = await loadIndiaBoundaries();
      setBoundaries(data);
    }
    loadBoundaries();
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

  // Build district labels from boundaries
  const districtLabels = useMemo(() => {
    return boundaries ? buildDistrictLabels(boundaries) : [];
  }, [boundaries]);

  // Handle view state change
  const handleViewStateChange = useCallback(({ viewState: newViewState }) => {
    setViewState(newViewState);
  }, []);

  // Handle issue toggle
  const handleIssueChange = useCallback((issue) => {
    setSelectedIssue((current) => (current === issue ? null : issue));
  }, []);

  // Handle boundary hover
  const handleBoundaryHover = useCallback((info) => {
    if (info.object) {
      setHoveredFeature({
        type: 'boundary',
        properties: info.object.properties,
      });
      setTooltipPosition({ x: info.x, y: info.y });
    } else if (hoveredFeature?.type === 'boundary') {
      setHoveredFeature(null);
    }
  }, [hoveredFeature]);

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

  // Build layers
  const layers = useMemo(() => {
    const layerList = [];

    // India boundaries layer
    if (boundaries) {
      layerList.push(
        new GeoJsonLayer({
          id: LAYER_IDS.boundaries,
          data: boundaries,
          stroked: true,
          filled: true,
          lineWidthMinPixels: 1,
          lineWidthMaxPixels: 2,
          getFillColor: COLORS.boundaryFill,
          getLineColor: COLORS.boundaryLine,
          pickable: true,
          onHover: handleBoundaryHover,
        })
      );

      // District labels layer
      layerList.push(
        new TextLayer({
          id: LAYER_IDS.labels,
          data: districtLabels,
          getPosition: (d) => d.coordinates,
          getText: (d) => d.name,
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

    // Hotspots layer (only when issue is selected)
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

    return layerList;
  }, [
    boundaries,
    districtLabels,
    hotspots,
    selectedIssue,
    getHotspotColor,
    handleBoundaryHover,
    handleHotspotHover,
    handleHotspotClick,
  ]);

  // Cursor style based on hover state
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
      />

      <div className={`map-container ${selectedDistrict ? 'panel-open' : ''}`}>
        <DeckGL
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          controller={true}
          layers={layers}
          getCursor={getCursor}
        >
          <Map mapStyle={MAP_STYLE} />
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
