#!/usr/bin/env node
/**
 * Syncs GeoJSON files from jsonfiles/out to public/india and generates manifest.
 * Run before build to ensure frontend displays all districts from jsonfiles/out.
 * Paths are relative to client/ (where this script lives).
 */
import { readdirSync, copyFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT_ROOT = join(__dirname, '..');
const SOURCE = join(CLIENT_ROOT, '..', 'jsonfiles', 'out');
const TARGET = join(CLIENT_ROOT, 'public', 'india');

mkdirSync(TARGET, { recursive: true });

let files = [];
try {
  files = readdirSync(SOURCE).filter((f) => f.endsWith('.geojson'));
} catch (err) {
  console.warn('jsonfiles/out not found or empty. GeoJSON files in public/india will be used as-is.');
  process.exit(0);
}

const slugs = files.map((f) => f.replace(/\.geojson$/, '')).sort();

for (const f of files) {
  copyFileSync(join(SOURCE, f), join(TARGET, f));
}

writeFileSync(join(TARGET, 'manifest.json'), JSON.stringify(slugs, null, 2));
console.log(`Synced ${slugs.length} state GeoJSON files to public/india`);
