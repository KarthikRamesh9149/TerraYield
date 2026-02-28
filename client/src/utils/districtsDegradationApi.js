/**
 * Fetches districts.csv and builds a lookup map for degradation levels.
 * Key: "state_name|district_name" (normalized for matching GeoJSON properties)
 */

const DISTRICTS_CSV_URL = '/data/districts.csv';

/**
 * Parse CSV text into rows with headers
 * @param {string} text - Raw CSV text
 * @returns {Array<Record<string, string>>}
 */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? '';
    });
    if (row.state_name || row.district_name) {
      rows.push(row);
    }
  }
  return rows;
}

/**
 * Build lookup map: "state_name|district_name" -> degradation_level
 * @param {Array<Record<string, string>>} rows - Parsed CSV rows
 * @returns {Map<string, string>}
 */
function buildDegradationLookup(rows) {
  const lookup = new Map();
  for (const row of rows) {
    const state = (row.state_name || '').trim();
    const district = (row.district_name || '').trim();
    const level = (row.degradation_level || 'unknown').toLowerCase();
    if (state && district) {
      lookup.set(`${state}|${district}`, level);
    }
  }
  return lookup;
}

/**
 * Fetch districts CSV and return degradation lookup
 * @returns {Promise<Map<string, string>>}
 */
export async function fetchDegradationLookup() {
  try {
    const res = await fetch(DISTRICTS_CSV_URL);
    if (!res.ok) return new Map();
    const text = await res.text();
    const rows = parseCSV(text);
    return buildDegradationLookup(rows);
  } catch (err) {
    console.warn('Degradation lookup failed:', err);
    return new Map();
  }
}
