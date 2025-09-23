# Brewlette

A coffee discovery app that picks a nearby coffee shop based on your current location or a postcode. Think "coffee roulette" — one spin, one coffee, endless choices.

## Features
- Location input via GPS or postcode
- Accurate distance filtering using Haversine great‑circle distance
- 5‑min and 10‑min walking radii (800 m / 1600 m)
- Rating‑weighted random selection to prefer better‑rated cafes
- Recent discoveries list with copy‑to‑clipboard
- Modern glassmorphism UI styled with Tailwind CSS

## Tech Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Prisma ORM + SQLite
- API Routes: `src/app/api/spin/route.ts`

## Repository layout
- App code: `brewlette/`
- DB schema: `brewlette/prisma/schema.prisma`
- Scripts: `brewlette/scripts/`
- Sample data: `london_coffee_shops.csv`

## Quickstart
```bash
# 1) Install deps (from the app folder)
cd brewlette
npm install

# 2) Initialize DB and import CSV
npm run setup

# (Optional) Backfill coordinates via postcodes.io + fallbacks
npm run backfill:postcodes

# 3) Start the dev server
npm run dev
```

Then open http://localhost:3000 and spin for coffee.

## Distance logic
- 5 minutes = 800 meters
- 10 minutes = 1600 meters

The backend filters candidates strictly within the chosen radius using the Haversine formula on the user’s coordinates and each shop’s coordinates. When enough coordinates already exist, the API uses a fast bounding‑box path (DB‑only) to return instantly.

## Data + Geocoding
- Postcode geocoding: https://postcodes.io/
- Nearby postcodes lookup for radius searches: https://postcodes.io
- Address fallback geocoding (for unresolved entries): Nominatim (OpenStreetMap)

Attribution
- Contains OS data © Crown copyright and database right 2025 (via postcodes.io)
- © OpenStreetMap contributors (via Nominatim). OpenStreetMap attribution required.

## Scripts
From `brewlette/`:
- `npm run setup` – Generate Prisma client, push schema, import CSV
- `npm run db:reset` – Reset DB and re‑import
- `npm run backfill:postcodes` – Populate missing lat/lng using postcodes.io (bulk) with fallbacks
- `npm run dev` – Start the dev server
- `npm run build` / `npm run start` – Production build & serve

## Troubleshooting
- "No coffee shops found": try 10‑min radius once to seed coordinates for the area; then switch back to 5‑min. Also check browser location permissions if using GPS.
- Rate limiting: geocoding providers may briefly rate‑limit. Re‑try the spin or allow a few seconds.

## License
This project is licensed under the MIT License. See `LICENSE` for details.
