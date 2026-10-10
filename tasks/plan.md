# Implementation Plan: E-Label DPP — final integration (10 Oct 2026)

## Overview
Finish the wine e-label / Digital Product Passport app for the 19:00 demo:
run it in Docker (not Render), refresh the UI/UX, add the standard SVG wine
label with a fixed DPP QR code, link ingredients to products, and give the
QR scan locations a home that QGIS can read.

## Status vs. the DPP doc and meeting notes

| Area | Status | Evidence |
|---|---|---|
| Product + ingredient CRUD, Excel import/export | Done | `server/routes.ts`, pages |
| Supabase auth, per-owner edit rights | Done | `server/supabase-auth.ts` |
| Public consumer page (scan target) | Done (basic) | `/qr/product/:id` → `PublicProductPage.tsx` |
| QR code | **Partial**. Encodes `externalLink`, not the DPP page; made by 3rd-party api.qrserver.com | `ProductDetailPage.tsx:146,522` |
| Ingredients on a product | **Missing**. No link between products and ingredients | `shared/schema.ts` |
| Wine-label SVG template | **Missing** | none |
| QR location capture / map / QGIS | **Not in repo**. Rohan's Python tool not pushed | grep: no geo/scan code |
| Docker | **Broken**. `husky: not found` in prod stage; `dotenv` is devDep but imported at runtime; `VITE_*` never reach the build (`.env` dockerignored) → blank page | baseline `docker build` log |
| docker-compose | **Missing** (DEVELOPMENT.md references it) | none |
| UI/UX refresh | **Not started** | default shadcn + purple, Replit banner in `index.html` |
| DPP doc: role-based views (public/business/repair/authority) | Not started. Single public view only | out of scope today |
| DPP doc: GS1 Digital Link identifiers, versioning/provenance | Not started | out of scope today |
| DPP doc "next task": study open-dpp / tractusx + AI compliance agents | Not started | research, not code |
| **Security**: real DB password, JWT secret, Sentry DSN committed in `.env.example` | **Leak** | `.env.example` |

## Architecture decisions
- **Docker = one app container + compose.** DB and auth stay on Supabase (auth depends on it).
  Skipped: a local Postgres container. Add it when moving off Supabase.
- **Images in Docker go to local disk** (`uploads/` volume) when no `BLOB_READ_WRITE_TOKEN` is set. The route already exists for the detail page.
- **QR is generated locally** (`qrcode` npm package) and points to `BASE_URL/qr/product/:id`, the DPP page. This works offline and the SVG embeds in the label.
- **Ingredients link** = `ingredient_ids integer[]` column on `products`. Skipped: a join table. Add it when per-product quantities/order are needed.
- **Label** = one React SVG component, viewBox in mm, **100 × 120 mm** (standard 750 ml Bordeaux back label, ~42% of a 236 mm circumference), QR fixed at bottom-right, 25 mm (above the 20 mm print minimum). Empty field = blank area. Download via `XMLSerializer` (native).
- **Scans/QGIS** = `scans` table + `POST /api/public/scans` (Rohan's Python tool or the public page posts `{productId, lat, lng}`) + `GET /api/scans.geojson`, which QGIS loads directly as a vector layer (Layer → Add Vector Layer → HTTP). Skipped: an in-app map. Add Leaflet if the demo needs a map inside the app.

## Phases

### Phase 0: Unblock (high risk first)
- T1 Fix Dockerfile + add `docker-compose.yml`. Local image fallback.
- T2 Scrub `.env.example` → placeholders. **The team must rotate the Supabase DB password + JWT secret.**

Checkpoint: `docker compose up --build` → `/api/health` ok, login page renders.

### Phase 1: UI/UX (main part)
- T3 Design tokens (wine palette, type scale, focus rings) in `index.css`/`tailwind.config.ts`; drop Replit banner.
- T4 Navigation + Landing.
- T5 Products list + Product detail layout.
- T6 Product form: sectioned, clearer hints.
- T7 Public DPP page per doc's UX rule: identifier visible, summary first, mobile-first.

Checkpoint: `npm run check` + `vite build` pass; manual pass at 375 px and 1280 px.

### Phase 2: Label + QR
- T8 Product ↔ ingredients (`ingredient_ids`), form multi-select, shown on public page.
- T9 Local QR to DPP URL (replace api.qrserver.com).
- T10 `WineLabel` SVG component + download on detail page.

Checkpoint: create product → label shows filled fields, blanks for empty ones, QR scans to DPP page.

### Phase 3: Scans → QGIS
- T11 `scans` table + public POST + GeoJSON export + QGIS how-to in README.

Checkpoint: POST a scan → appears in GeoJSON → loads in QGIS.

### Phase 4: Ship
- T12 Full Docker rebuild, smoke test, update README (Docker run steps).

## Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Rohan's Python tool output format unknown | Med | Fix the contract now (`POST /api/public/scans` JSON); his tool adapts |
| Supabase schema change (`db:push`) on shared DB | Med | Additive columns/tables only |
| Leaked credentials already public | High | Rotate in Supabase today, independent of code |
| UI refresh regresses flows | Med | Restyle only; no logic changes in Phase 1 |

## Open questions
1. Does Rohan's Python QR tool POST coordinates itself, or should the public page ask the browser for location (needs user consent)?
2. Docker "deploy" target: a team machine/VM running compose, or just local demo? (Plan works for both.)
3. Pushing to GitHub: from this machine, or will Om push?
