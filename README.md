# Agri Intelligence Dashboard

Agricultural Intelligence Platform for India — visualizing soil degradation, yield trends, crop recommendations, and policy simulation across key districts.

## Features

- **Feature 1: Land Intelligence Dashboard** — Hotspot visualization, district digital twins, health scores, AI narrative
- **Feature 2: Crop Matchmaker** — Top 3 crop recommendations, companion planting, economics, nitrogen savings
- **Feature 3: Policy Simulator** — Upload policy sheets, red flag detection, crop arbitrage, 3-year roadmap, PDF export

## Setup

1. Copy `.env.example` to `.env`, fill Mistral keys:
```bash
# Windows
copy .env.example .env
# Linux/Mac
cp .env.example .env
```

2. Install dependencies (from repo root):
```bash
npm install
cd client && npm install
cd ../server && npm install
```

## Dev

```bash
npm run dev  # starts both client (5173) and server (8787)
```

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

## Test

```bash
# Server tests
cd server && npm test

# Client tests
cd client && npm test
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, DeckGL + MapLibre |
| Backend | Node.js + Fastify + TypeScript |
| Architecture | Clean Architecture (Domain → Application → Infrastructure → Interface) |
| Logging | Pino (structured) |
| Validation | Zod |
| LLM | Mistral AI (server-side proxy) |
| Testing | Vitest |

## Data Files

| File | Description |
|------|-------------|
| `/client/public/districts/{id}.json` | 4 district digital twins |
| `/client/public/hotspots.geojson` | Map hotspot features |
| `/client/public/data/crops_database.json` | 19 crops with agronomy/economics |
| `/client/public/data/companion_rules.json` | 26 nitrogen benefit pairs |

## Environment Variables

```env
PORT=8787
NODE_ENV=development
LOG_LEVEL=debug
MISTRAL_FEATURE1_KEY=       # For Feature 1 narrative
MISTRAL_FEATURE2_KEY=       # For Feature 2 crop-why
MISTRAL_FEATURE3_KEY=       # For Feature 3 cabinet brief
MISTRAL_BRIEF_KEY=          # For Feature 3 polishing
```

## Troubleshooting

- **Mistral errors**: Check `MISTRAL_FEATURE*_KEY` env vars in `server/.env`
- **Map not loading**: Verify CARTO tile access (requires internet)
- **Port conflicts**: Check that ports 5173 and 8787 are free
- **Module not found**: Run `npm install` in both `client/` and `server/`
- **Stub mode**: Set `USE_REAL_API = false` in `client/src/utils/cropApi.js` for offline development

## Project Structure

```
├── client/                    # Vite React Frontend
│   ├── public/
│   │   ├── hotspots.geojson
│   │   ├── india/            # State boundary GeoJSON
│   │   ├── districts/        # District JSON profiles
│   │   └── data/             # Crops DB + companion rules
│   └── src/
│       ├── components/       # React components
│       │   └── panels/       # Feature panels (LandIntel, CropMatch, PolicySim)
│       ├── domain/           # Pure business logic (red flags, arbitrage, roadmap)
│       ├── hooks/            # React hooks
│       └── utils/            # API utilities, parsers
│
├── server/                    # Fastify TypeScript API
│   └── src/
│       ├── domain/           # Entities, value objects, services
│       ├── application/      # Use cases, ports
│       ├── infrastructure/   # Repositories, AI client, logging
│       └── interfaces/http/  # Routes, plugins
│
└── package.json              # Root workspace config
```

## License

MIT
