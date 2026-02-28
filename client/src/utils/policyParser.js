/**
 * Policy Parser — parses CSV/XLSX files and validates policy rows
 * Uses SheetJS (xlsx) for spreadsheet parsing
 * Pure validation logic after parsing
 */

import * as XLSX from 'xlsx';

const VALID_DISTRICT_IDS = ['ahmednagar_mh', 'yavatmal_mh', 'bathinda_pb', 'mandya_ka'];

const REQUIRED_COLUMNS = [
    'district_id',
    'crop',
    'budget_amount_inr_lakh',
    'subsidy_type',
    'target_area_hectares',
];

/**
 * Parse a File (CSV or XLSX) into an array of row objects
 * @param {File} file - The uploaded file
 * @returns {Promise<Object>} { valid: Row[], errors: ErrorDetail[] }
 */
export async function parseAndValidatePolicyFile(file) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rawRows.length === 0) {
        return { valid: [], errors: [{ row: 0, message: 'File is empty or has no data rows' }] };
    }

    // Check for required columns
    const headers = Object.keys(rawRows[0]);
    const missingColumns = REQUIRED_COLUMNS.filter(
        (col) => !headers.some((h) => h.toLowerCase().trim() === col)
    );

    if (missingColumns.length > 0) {
        return {
            valid: [],
            errors: [{ row: 0, message: `Missing required columns: ${missingColumns.join(', ')}` }],
        };
    }

    return validateRows(rawRows);
}

/**
 * Validate an array of raw row objects
 * @param {Object[]} rawRows
 * @returns {{ valid: Object[], errors: Object[] }}
 */
export function validateRows(rawRows) {
    const valid = [];
    const errors = [];

    rawRows.forEach((raw, index) => {
        const rowNum = index + 2; // 1-indexed + header row
        const row = normalizeRowKeys(raw);
        const rowErrors = [];

        // district_id validation
        if (!VALID_DISTRICT_IDS.includes(row.district_id)) {
            rowErrors.push(
                `Invalid district_id "${row.district_id}". Must be one of: ${VALID_DISTRICT_IDS.join(', ')}`
            );
        }

        // crop validation
        if (!row.crop || String(row.crop).trim() === '') {
            rowErrors.push('crop is required');
        }

        // budget_amount_inr_lakh validation
        const budget = Number(row.budget_amount_inr_lakh);
        if (!Number.isFinite(budget)) {
            rowErrors.push('budget_amount_inr_lakh must be a finite number');
        } else if (budget < 0) {
            rowErrors.push('budget_amount_inr_lakh must be >= 0');
        }

        // subsidy_type validation
        if (!row.subsidy_type || String(row.subsidy_type).trim() === '') {
            rowErrors.push('subsidy_type is required');
        }

        // target_area_hectares validation
        const area = Number(row.target_area_hectares);
        if (!Number.isFinite(area)) {
            rowErrors.push('target_area_hectares must be a finite number');
        } else if (area <= 0) {
            rowErrors.push('target_area_hectares must be > 0');
        }

        if (rowErrors.length > 0) {
            errors.push({ row: rowNum, message: rowErrors.join('; ') });
        } else {
            valid.push({
                district_id: row.district_id,
                crop: String(row.crop).trim(),
                budget_amount_inr_lakh: budget,
                subsidy_type: String(row.subsidy_type).trim(),
                target_area_hectares: area,
            });
        }
    });

    return { valid, errors };
}

/**
 * Normalize row keys to lowercase/underscore format
 */
function normalizeRowKeys(row) {
    const normalized = {};
    for (const key of Object.keys(row)) {
        normalized[key.toLowerCase().trim()] = row[key];
    }
    return normalized;
}
