/**
 * useDistrictData Hook
 * Fetches all data needed for a selected district:
 * - District info with scores (Feature 1)
 * - Crop recommendations (Feature 2)
 * - LLM explanations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchDistrictWithScores,
  fetchNarrative,
  fetchCropRecommendations,
  fetchCropWhyExplanation,
} from '../utils/cropApi';

/**
 * @param {string|null} districtId - The selected district ID
 * @returns {Object} Data, loading state, and error
 */
export function useDistrictData(districtId) {
  // District data and scores
  const [district, setDistrict] = useState(null);

  // Feature 1: Narrative
  const [narrative, setNarrative] = useState(null);

  // Feature 2: Crop recommendations
  const [cropRecommendations, setCropRecommendations] = useState(null);
  const [cropWhyExplanation, setCropWhyExplanation] = useState(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [cropWhyLoading, setCropWhyLoading] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  // Fetch core data when district changes
  useEffect(() => {
    if (!districtId) {
      setDistrict(null);
      setNarrative(null);
      setCropRecommendations(null);
      setCropWhyExplanation(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch district and crop recommendations in parallel
        const [districtData, cropsData] = await Promise.all([
          fetchDistrictWithScores(districtId),
          fetchCropRecommendations(districtId),
        ]);

        if (cancelled) return;

        setDistrict(districtData);
        setCropRecommendations(cropsData);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to fetch district data');
        console.error('Error fetching district data:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [districtId]);

  // Fetch narrative separately (can be slower due to LLM)
  const loadNarrative = useCallback(async () => {
    if (!districtId) return;

    setNarrativeLoading(true);
    try {
      const data = await fetchNarrative(districtId);
      setNarrative(data);
    } catch (err) {
      console.error('Error fetching narrative:', err);
      // Don't set error state - narrative is optional enhancement
    } finally {
      setNarrativeLoading(false);
    }
  }, [districtId]);

  // Fetch "Why this fits" explanation separately
  const loadCropWhyExplanation = useCallback(async () => {
    if (!districtId) return;

    setCropWhyLoading(true);
    try {
      const data = await fetchCropWhyExplanation(districtId);
      setCropWhyExplanation(data);
    } catch (err) {
      console.error('Error fetching crop explanation:', err);
      // Don't set error state - explanation is optional enhancement
    } finally {
      setCropWhyLoading(false);
    }
  }, [districtId]);

  // Auto-load narrative and explanation when district changes
  useEffect(() => {
    if (districtId) {
      loadNarrative();
      loadCropWhyExplanation();
    }
  }, [districtId, loadNarrative, loadCropWhyExplanation]);

  return {
    // Core data
    district,
    scores: district?.scores || null,

    // Feature 1: Land Intelligence
    narrative: narrative?.narrative || null,
    narrativeLoading,

    // Feature 2: Crop Matchmaker
    cropRecommendations,
    cropWhyExplanation: cropWhyExplanation?.why_explanation || null,
    cropWhyLoading,

    // Overall state
    loading,
    error,

    // Actions
    refreshNarrative: loadNarrative,
    refreshCropWhy: loadCropWhyExplanation,
  };
}
