# CLAUDE.md — Agri Intelligence Dashboard

## Architecture Overview

```
┌────────────────────┐     ┌────────────────────┐
│   Client (React)   │────▶│   Server (Fastify)  │
│   Port 5173        │     │   Port 8787          │
│                    │     │                      │
│ ┌────────────────┐ │     │ ┌──────────────────┐ │
│ │ Components     │ │     │ │ Interface (HTTP)  │ │
│ │  ├ MapScene    │ │     │ │  ├ Routes         │ │
│ │  ├ RightPanel  │ │     │ │  └ Plugins        │ │
│ │  ├ Sidebar     │ │     │ ├──────────────────┤ │
│ │  └ Panels/     │ │     │ │ Application      │ │
│ ├────────────────┤ │     │ │  └ Use Cases      │ │
│ │ Domain (pure)  │ │     │ ├──────────────────┤ │
│ │  ├ redFlags    │ │     │ │ Domain (pure)    │ │
│ │  ├ arbitrage   │ │     │ │  ├ ScoreCalc     │ │
│ │  └ roadmap     │ │     │ │  └ CropMatcher   │ │
│ ├────────────────┤ │     │ ├──────────────────┤ │
│ │ Utils          │ │     │ │ Infrastructure   │ │
│ │  ├ cropApi     │ │     │ │  ├ Repositories  │ │
│ │  ├ hotspotsApi │ │     │ │  ├ MistralClient │ │
│ │  └ policyParse │ │     │ │  └ Logging       │ │
│ └────────────────┘ │     │ └──────────────────┘ │
└────────────────────┘     └────────────────────┘
```

## Module Boundaries

### What can import what

| Module | Can import from |
|--------|----------------|
| `domain/` | Nothing (pure functions, no I/O) |
| `application/` | `domain/`, port interfaces |
| `infrastructure/` | `domain/`, `application/` ports |
| `interfaces/http/` | `application/` use cases |
| `components/panels/` | `domain/`, `utils/`, `hooks/` |
| `utils/` | External APIs, `domain/` |
| `hooks/` | `utils/` |

### Critical rule
- **Domain must never import I/O** — no `fetch`, no `fs`, no React, no Fastify
- **Mistral keys stay server-side** — never in client bundle, never in `VITE_*` env vars
- **USE_REAL_API flag** — `client/src/utils/cropApi.js` line 7; set to `false` for offline stub mode

## Data Contracts

### District JSON Schema (`/public/districts/{id}.json`)

```json
{
  "district_id": "ahmednagar_mh",
  "name": "Ahmednagar",
  "state": "Maharashtra",
  "region_type": "drought_prone",
  "feature_1_land_intelligence": {
    "geography": { "soil_ph": 7.8, "organic_carbon_percent": 0.45, "nitrogen_kg_hectare": 220, ... },
    "water": { "groundwater_depth_m": 72, "critical_depth_m": 120, "years_until_bankruptcy": 8, ... },
    "climate": { "max_temp_c": 45, "drought_probability": "very_high", ... },
    "current_status": { "dominant_crop": "BT cotton", "current_crop_water_usage_liters_kg": 22000, ... }
  },
  "feature_2_crop_economics": { ... },
  "feature_3_policy_arbitrage": { ... }
}
```

### Crop Schema (`/public/data/crops_database.json`)

```json
{
  "crop_id": "tur_dal",
  "name": "Pigeon Pea (Tur Dal)",
  "agronomy": {
    "ph_min": 5.0, "ph_max": 8.5,
    "temp_max_survival_c": 45,
    "drought_tolerance": 0.85,
    "nitrogen_fixation": true,
    "water_liters_per_kg": 2200
  },
  "economics": { "profit_band": 4, "msp_inr_quintal": 7550 },
  "companion": { "best_companion_crop_id": "jowar", "intercropping_ratio": "80:20" }
}
```

### Hotspot Schema (`/public/hotspots.geojson`)

Each feature has: `district_id`, `soil_risk_score`, `yield_trend`, `yield_trend_pct`, `name`

### District IDs (must match everywhere)

- `ahmednagar_mh`
- `yavatmal_mh`
- `bathinda_pb`
- `mandya_ka`

## Coding Conventions

- **Server**: TypeScript strict mode, Clean Architecture, Zod validation on all routes
- **Client**: JavaScript with JSDoc typing, React hooks, no class components
- **CSS**: Vanilla CSS with CSS custom properties (design tokens in `index.css`)
- **Theme**: Dark (#0d1117) with Outfit font
- **Error handling**: `AppError` hierarchy on server, try-catch with console.error on client
- **Logging**: Pino structured logging on server, console on client

## How to Add a New District

1. Create `/client/public/districts/{new_id}.json` following the existing schema
2. Add a feature to `/client/public/hotspots.geojson` with matching `district_id`
3. Add the new ID to `VALID_DISTRICT_IDS` in `client/src/utils/policyParser.js`
4. Add the new ID to `server/src/infrastructure/repositories/FileDistrictRepository.ts`
5. The sidebar district list in `Sidebar.jsx` auto-populates from hotspots data

## How to Add a New Crop

1. Add entry to `/client/public/data/crops_database.json` following the crop schema
2. If it has companion planting benefits, add a rule to `/client/public/data/companion_rules.json`
3. Both `CropMatcher` (server) and `generateStubRecommendations` (client) automatically pick it up
4. No code changes needed — the scoring algorithm handles all crops generically

## How to Change Mistral Models

Models are configured in `server/.env`:

```env
MISTRAL_FEATURE1_KEY=your-key     # Feature 1 narrative
MISTRAL_FEATURE1_MODEL=mistral-small-latest

MISTRAL_FEATURE2_KEY=your-key     # Feature 2 crop-why
MISTRAL_FEATURE2_MODEL=mistral-small-latest

MISTRAL_FEATURE3_KEY=your-key     # Feature 3 cabinet brief
MISTRAL_FEATURE3_MODEL=mistral-large-latest

MISTRAL_BRIEF_KEY=your-key        # Feature 3 polishing
MISTRAL_BRIEF_MODEL=mistral-medium-latest
```

All Mistral calls go through `server/src/infrastructure/ai/MistralClient.ts` with retry logic.

## Test Strategy

| Scope | Tool | Files |
|-------|------|-------|
| Domain logic (server) | Vitest | `server/src/domain/services/__tests__/CropMatcher.test.ts`, `ScoreCalculator.test.ts` |
| Domain logic (client) | Vitest | `client/src/domain/__tests__/policyRedFlags.test.js`, `policyRoadmap.test.js` |
| Integration | Manual | Start both servers, test features end-to-end |

Run tests:
```bash
cd server && npm test
cd client && npm test
```

## Release Checklist

- [ ] All tests pass (`npm test` in both packages)
- [ ] `USE_REAL_API` set to `true` in `cropApi.js` for production
- [ ] All Mistral API keys populated in `server/.env`
- [ ] CORS origin updated in `server/src/app.ts` for production domain
- [ ] `npm run build` succeeds in both packages
- [ ] No console errors in browser
- [ ] PDF export produces valid output
- [ ] Rate limiting verified (60 req/min)