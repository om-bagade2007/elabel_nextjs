# Wine Label Management System (Open E-Label)

A web app for wine producers to publish EU e-labels and Digital Product Passports (DPP). You enter a
wine once. The app prints a standard back label with a QR code, and the QR opens a public page with
the ingredients, nutrition and producer details shoppers are entitled to see.

Live site: https://wine-label-management-system.onrender.com

## Contents

1. [Features](#features)
2. [How to use it: step by step](#how-to-use-it-step-by-step)
3. [Tech stack](#tech-stack)
4. [Configuration](#configuration)
5. [Deploy](#deploy): [Render](#render-the-live-site), [Docker](#docker-any-machine), [Sentry](#sentry-error-monitoring)
6. [Local development](#local-development)
7. [Location services](#location-services)
8. [API](#api)
9. [Database](#database)
10. [Excel import and export](#excel-import-and-export)
11. [Project structure](#project-structure)
12. [Troubleshooting](#troubleshooting)
13. [Contributing](#contributing)

## Features

- **Products and ingredients:** create, edit, duplicate and delete. Attach ingredients to a product
  in label order; allergens are printed in bold. Excel import and export.
- **Wine label (SVG):** a 100 × 120 mm back label for a standard 750 ml bottle, filled from the
  product form. Empty fields stay blank. The DPP QR code sits at a fixed spot (25 mm, bottom right).
  Download the label as SVG, or the QR code as SVG or PNG (1000 × 1000).
- **Public passport page:** what the QR opens. No login needed, built for phones. Three addresses
  open the same page: `/qr/product/<id>`, `/dpp/<id>` and `/p/<id>`. If a product has a
  *Redirect Link*, the page forwards there.
- **Manufacturing location:** facility, address and GPS coordinates, fetched automatically from the
  device's GPS, with an IP-address fallback, an address search and manual entry. All services are
  free and need no API key; see [Location services](#location-services).
- **QR scan locations (optional):** when a shopper allows it, the location of each QR scan is stored.
- **Login:** Supabase Auth (password or magic link). Everyone can see all products; only the owner
  can edit or delete one.

## How to use it: step by step

**1. Log in.** Open the site, click **Log in to the dashboard**, and sign in with your email and
password, or a magic link sent by email. New users register first.

**2. Add your ingredients once.** Go to **Ingredients**, then **New ingredient**. Enter the name,
category and E-number (e.g. `E220`), and tick any allergens in the *Allergens* box (e.g. Sulphites).
Ingredients can be reused across all your products. To add a list, use **Import** with an Excel or
CSV file.

**3. Create a product.** Go to **Products**, then **New product**, and fill in the form:
- *Product information* and *Wine details*: name, brand, volume, vintage, type, sugar, alcohol.
- *Ingredients*: tick them **in the order they should appear on the label**. The numbers show the
  order. Allergens print in bold.
- *Nutrition*, *Responsible consumption* (warning pictograms) and *Certifications*.
- *Manufacturing location*: filled in automatically when the form opens (see step 4).
- *Food business operator*, *Logistics* (country, SKU, EAN), and the product image (in
  *Portability & External Links*).

Click **Create product**. Fields you leave empty stay blank on the label.

**4. Check the manufacturing location.**
- When you open the form, the browser asks for your location. Click **Allow** to use the device's GPS.
- If GPS is off or you say no, the app estimates the location from your internet connection (IP address).
- To use another place, type an address or estate name and click **Find coordinates**, or type
  the details in yourself. Click **Auto-fetch location** to try again.
- **Preview on map** opens the coordinates in Google Maps.

**5. Get the label and QR code.** Open the product. The **Bottle label** panel shows the 100 × 120 mm label.
- **Download label (SVG)** for printing; the label is true to size.
- **QR (SVG)** or **QR (PNG)** for the QR code alone. PNG files are 1000 × 1000 px.
- **Open public passport** to see what shoppers see. On the Products list, the **⋮** menu also has
  **Public passport** and **Download QR code (PNG)**.

**6. Print and check.** Print the label at 100 % scale, without "fit to page". Scan the QR with a phone:
it must open `https://wine-label-management-system.onrender.com/qr/product/<id>` and show the wine.

**7. Edit later.** Open the product and click **Edit**. Changes show on the passport straight away.
A printed QR code never needs reprinting, because it always points to the same page.

## Tech stack

React, TypeScript, Vite, Tailwind CSS and shadcn/ui on the frontend; Express on the server; Supabase
(PostgreSQL + Auth) with Drizzle ORM; `qrcode` for QR codes; Multer for uploads; XLSX for Excel.

## Configuration

Copy `.env.example` to `.env` (PowerShell: `Copy-Item .env.example .env`) and fill it in. The file
explains every variable. The ones that matter most:

| Variable | What to put |
|---|---|
| `DATABASE_URL` | The **Session pooler** string from Supabase → *Connect* → *Session pooler*. The direct `db.<ref>.supabase.co` host is IPv6-only, and Docker cannot reach it. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` and the matching `VITE_*` values | From Supabase → *Project Settings* → *API*. `VITE_*` values are built into the browser bundle, so rebuild after changing them. |
| `BASE_URL` | The public address of the site, e.g. `https://wine-label-management-system.onrender.com`. |
| `SCANS_EXPORT_KEY` | Optional. Any secret string. It turns on the scan-location export (`/api/scans.geojson`). Leave it empty to keep the export off. |

**QR codes never contain localhost.** A QR uses the first public address among `BASE_URL`, the
address the dashboard is opened on, and the live site above. A QR made on a local copy therefore
still opens on the live site, which shares the same database.

**Database changes apply themselves.** On start, the server runs the re-runnable SQL files in
`server/db/` (`server/migrate.ts`); the log shows `Database schema is up to date`. Only
`server/db/profiles.sql` is a one-time manual step, run in the Supabase SQL editor if it was never run.

## Deploy

### Render (the live site)

**First-time setup** (already done for the live site; for a new service):
1. Render → *New* → *Web Service* → connect `om-bagade2007/elabel_nextjs`, branch `main`.
2. Runtime: **Node**. Build command: `npm install --include=dev && npm run build`
   (`--include=dev` keeps the build tools even when `NODE_ENV=production` is set). Start command: `npm start`.
   Health check path: `/api/health`.
3. Under *Environment*, add the variables from `.env.example`:
   - `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `BASE_URL=https://wine-label-management-system.onrender.com`
   - Optional: `SCANS_EXPORT_KEY`, and the Sentry values (see below).

**Every update:**
1. Merge or push your change into `main` on GitHub.
2. Render → the service → **Manual Deploy** → *Deploy latest commit*. It does not deploy on its own.
3. In *Logs*, wait for `Database schema is up to date` and `Server is running`.
4. Check it after every deploy:
   - [ ] `https://wine-label-management-system.onrender.com/api/health` returns `{"status":"ok"}`.
   - [ ] Log in, then create a test product. It saves without an error.
   - [ ] On the product page, the link under the label starts with the Render address, not `localhost`.
   - [ ] Scan the label's QR with a phone. The passport page opens.
   - [ ] Delete the test product.

If you change any `VITE_*` value, deploy again: those values are built into the page.

### Docker (any machine)
1. Install Docker Desktop and start it.
2. `git clone` the repo, then `cp .env.example .env` and fill it in (see Configuration). Set
   `BASE_URL` to the address phones will use, e.g. `http://192.168.1.20:5000` or your domain.
3. Build and start:
   ```bash
   docker compose up -d --build
   curl http://localhost:5000/api/health   # {"status":"ok"}
   ```
4. Logs: `docker compose logs -f app`. Stop: `docker compose down`.
5. To update: `git pull`, then `docker compose up -d --build` again.

The image runs as a non-root user. Uploaded images live in the `uploads` volume and survive
updates. Never commit `.env`.

### Sentry (error monitoring)
1. Create a free account at https://sentry.io. Create a **React** project, and copy its **DSN**
   (*Project Settings → Client Keys (DSN)*).
2. Set `VITE_SENTRY_DSN=<that DSN>` in Render's *Environment*, or in `.env` for Docker. Deploy or
   rebuild: the DSN is built into the page, so it only takes effect after a new build.
3. Optional, readable stack traces: create an auth token (*Settings → Auth Tokens*, scope
   `project:releases`), and set `SENTRY_AUTH_TOKEN` in Render. Source maps then upload during
   the build. The Sentry org and project names are set in `vite.config.ts` (`canspirit-ai` /
   `elabel`); change them there if you use your own Sentry account. The Docker build does not
   pass this token, so source-map upload only runs on Render.
4. Check it. **This needs a second person; don't tick it off on your own.**
   - [ ] Render *Environment* has `VITE_SENTRY_DSN`, and a deploy ran after it was added.
   - [ ] Open the live site, open the browser console (F12), and run
     `setTimeout(() => { throw new Error('Sentry test') })`.
   - [ ] Within a minute, Sentry → *Issues* shows "Sentry test" with the site's address.
   - [ ] If `SENTRY_AUTH_TOKEN` is set: the issue's stack trace shows real file names
     (e.g. `PublicProductPage.tsx`), not only `index-….js`.

Limit: Sentry currently reports **browser** errors only. The server sends errors to Sentry only in
the dev server (`server/index.ts`, via `SENTRY_DSN`), not in the production server
(`server/production.ts`) that Render and Docker run.

## Local development

Requires Node.js 20+ and npm.

```bash
npm install
cp .env.example .env    # then fill it in, see Configuration
npm run dev             # http://localhost:5000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` / `npm start` | Production build and start |
| `npm run check` | TypeScript type check |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm run db:push` | Push `shared/schema.ts` to a database (not needed for normal use) |
| `npm run check:storage` | Ingredient and scan storage check. **Run against a test database only.** |
| `npm run check:migrate` | Startup-migration check against an old-schema database. **Test database only.** |

There is no `npm test` suite yet. `npm test` only prints a message.

## Location services

All of these are free and need no API key:

| Function | Service | Where it runs |
|---|---|---|
| Live GPS coordinates | HTML5 Geolocation API (the device's own GPS) | Browser |
| Address from coordinates | OpenStreetMap Nominatim (`nominatim.openstreetmap.org`) | Browser, plus server `/api/geolocation/reverse` |
| IP fallback | `ipwho.is`, then `ipapi.co` | Server `/api/geolocation/detect`, then browser |
| Coordinates from an address | OpenStreetMap Nominatim | Browser, plus server `/api/geolocation/search` |
| Map view | Google Maps link (`google.com/maps?q=lat,lng`) | Product form, product page, public page |

The order is: GPS, then the IP lookup, then manual entry. Code: `client/src/lib/geolocation.ts`
and `server/routes.ts`. IP lookups give a city-level estimate, not the exact building, so check
the result. Nominatim allows about one request per second; that is plenty for a product form.

**QR scan locations (optional).** When a shopper opens the passport from a QR code, the page asks
for their location; they can say no. Allowed locations are stored in the `scans` table. Other tools
can post scans too, up to 60 per minute per IP:
```bash
curl -X POST $BASE_URL/api/public/scans -H 'Content-Type: application/json' \
  -d '{"productId": 1, "lat": 18.5204, "lng": 73.8567, "source": "my-tool"}'
```
With `SCANS_EXPORT_KEY` set, `GET $BASE_URL/api/scans.geojson?key=<key>` returns all scans as
GeoJSON, which any map tool can open.

## API

Endpoints marked 🔒 need a Supabase access token (`Authorization: Bearer <token>`); the app sends it
automatically.

| Method and path | Purpose |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/config` | Public settings for the browser (Supabase URL/anon key, public URL) |
| `GET /api/public/products/:id` | Product with its ingredients, for the passport page |
| `POST /api/public/scans` | Record a QR scan `{productId, lat, lng, source?}` |
| `GET /api/scans.geojson?key=…` | All scans as GeoJSON (needs `SCANS_EXPORT_KEY`) |
| `GET /api/geolocation/detect`, `/reverse?lat=&lon=`, `/search?q=` | Location helpers for the product form |
| 🔒 `GET/POST /api/products`, `GET/PUT/DELETE /api/products/:id` | Products |
| 🔒 `POST/DELETE /api/products/:id/image`, `POST /api/get-url` | Product images |
| 🔒 `GET /api/products/export`, `POST /api/products/import` | Excel export and import |
| 🔒 `GET/POST /api/ingredients`, `GET/PUT/DELETE /api/ingredients/:id` | Ingredients |
| 🔒 `GET /api/ingredients/export`, `POST /api/ingredients/import` | Excel export and import |

Login, registration and password reset go straight to Supabase Auth from the browser; there are no
`/api/auth` endpoints.

## Database

Tables are defined in `shared/schema.ts`.

- **products:**
  - identity: name, brand, net volume, vintage, wine type, sugar content, appellation, alcohol
  - nutrition per 100 ml: kcal, kJ, fat, saturates, carbohydrates, sugar, protein, salt, portion size
  - warnings (pregnancy, under 18, driving) and certifications (organic, vegetarian, vegan)
  - packaging gases
  - operator: type, name, address, info
  - country of origin, SKU, EAN
  - manufacturing: location, address, city, state, country, postal code, latitude, longitude
  - external link, redirect link, image URL
  - `ingredient_ids` (label order), owner, timestamps
- **ingredients:** name, category, E-number, allergens, details, owner, timestamps.
- **scans:** product, latitude, longitude, source, time.
- **users:** an older table from before Supabase Auth; logins now use Supabase.

## Excel import and export

**Products import** reads these columns; the names in brackets also work:
`Name` (Product Name), `Net Volume` (Volume), `Vintage` (Year), `Wine Type` (Type, Wine Category),
`Sugar Content` (Sugar), `Appellation` (Region), `SKU` (Product Code). Other product fields are edited
in the app.

**Products export** writes Name, Net Volume, Vintage, Type, Sugar Content, Appellation, SKU and the
manufacturing location with its coordinates.

**Ingredients** import and export use `Name`, `Category`, `E Number`, `Allergens` (comma-separated)
and `Details`.

## Project structure

```
client/src/
  components/label/   WineLabel: label SVG, QR code, downloads
  components/forms/   Product and ingredient forms, ingredient picker
  components/         layout, tables, modals, ui (shadcn)
  pages/              Dashboard pages and the public passport page
  lib/                Auth, API client, geolocation helpers
server/
  routes.ts           API endpoints
  storage.ts          Database queries (Drizzle)
  migrate.ts          Applies server/db/*.sql on start
  production.ts       Production server; index.ts is the dev server
  db/                 SQL migrations
shared/schema.ts      Database tables and validation
scripts/              Dev runner and check scripts
docs/                 Screenshots and status report
Dockerfile, docker-compose.yml
```

Further reading: `implementation.md` (how the latest version was built) and `result.md` (what
was fixed and what is left).

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| "Failed to create product" | The database is missing columns. Redeploy: they are added on start. Check the log for `Database schema is up to date`. |
| QR opens `localhost` | The QR was downloaded from an old version. Redeploy, download it again and reprint. Set `BASE_URL` to the public address. |
| Docker: `getaddrinfo ENOTFOUND db.….supabase.co` | `DATABASE_URL` uses the IPv6-only direct host. Use the Session pooler string. |
| Blank page after a Docker build | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` were empty at build time. Fill `.env` and rebuild. |
| Location stays empty | The browser blocked location, and the IP services were unreachable. Use **Find coordinates**, or type the address. |
| Render build fails on `vite` or `esbuild` | Use the build command `npm install --include=dev && npm run build`. |

## Contributing

Create a branch, make your change, run `npm run check`, and open a pull request into `main`.
Pull before you push; several people work on `main`.

## License

MIT
