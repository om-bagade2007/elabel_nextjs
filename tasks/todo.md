> **Historical plan (10 Oct 2026).** QGIS was later dropped in favour of GPS, Nominatim and
> Google Maps links. See `result.md` §10 for what changed afterwards.

# Todo

- [x] T1 Docker: fixed Dockerfile (husky, dotenv, VITE build args), docker-compose.yml, local image fallback. Verified: image builds, container serves API + pages.
- [x] T2 `.env.example` placeholders only. **Team: rotate Supabase DB password + JWT secret (they were public).**
- [x] T3 Design tokens (grape/plum/chalk/vine), Gloock + Public Sans, Replit banner removed, focus + reduced motion.
- [x] T4 Navigation (works on phones) + landing with live label.
- [x] T5 Products list (responsive, loading/empty states) + detail page (label panel).
- [x] T6 Product form: ingredient picker, edit-form defaults bug fixed.
- [x] T7 Public DPP page: mobile-first, ID visible, empty fields hidden, redirectLink honoured.
- [x] T8 `ingredient_ids` on products, label order kept, allergens bold.
- [x] T9 Local QR → `BASE_URL/qr/product/:id?src=qr` (no third-party API).
- [x] T10 `WineLabel` SVG 100×120 mm, QR 25 mm fixed, SVG download with inlined pictograms.
- [x] T11 Scans: table, `POST /api/public/scans`, `GET /api/scans.geojson?key=`, QGIS steps in README.
- [x] T12 Docker rebuild + Playwright screenshot pass (375/1280 px, no overflow, no console errors) + README.

## Left for the team
- [ ] Put the Supabase **Session pooler** URL in `.env` → `docker compose up -d --build`.
- [ ] Run `server/db/add_manufacturing_columns.sql` and `server/db/add_ingredients_and_scans.sql` in Supabase SQL editor.
- [ ] Rohan: point the Python QR tool at `POST /api/public/scans`.
- [x] Pushed branch `feature/docker-ui-label-qgis`, merged with Rohan's manufacturing-location commit, PR opened.
