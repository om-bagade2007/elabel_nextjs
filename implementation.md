# Implementation: Open E-Label final integration

Date: 10 October 2026. Scope: the items agreed in the meeting (wine-label SVG, DPP QR code, QR
locations on a map, UI/UX refresh, Docker deployment), checked against the DPP reference document.

> **Update:** QGIS is no longer used. The app gets locations from the device GPS, OpenStreetMap
> Nominatim and ipwho.is/ipapi.co, and shows them with Google Maps links (README → *Location
> services*). Section 10 lists the later changes.

## 1. Starting point

What the repository already did when work began:

| Area | State before |
|---|---|
| Product and ingredient CRUD, Excel import/export | Working |
| Supabase login and per-owner edit rights | Working |
| Public consumer page `/qr/product/:id` | Basic. Showed "Not specified" for every empty field |
| QR code | Built by a third-party site (api.qrserver.com) from the *external link*, not the product passport |
| Ingredients on a product | Missing. Ingredients existed but could not be attached to a product |
| Wine-label SVG | Missing |
| QR scan locations / map | Missing. The Python QR tool was not in the repository |
| Docker | Broken. The image did not build |
| UI | Default component-kit look, purple theme, Replit banner script in `index.html` |

## 2. Process

The work followed one loop for every task: **read the code → write the smallest change → verify
with a real run → fix what the run showed → verify again.**

1. **Audit.** Cloned the repo, read the DPP document and the meeting notes, and listed every
   feature as done, partial or missing (section 1).
2. **Reproduce before fixing.** Built the existing Dockerfile and recorded the exact failure
   instead of guessing.
3. **Plan.** Broke the work into 12 tasks with acceptance checks (`tasks/plan.md`,
   `tasks/todo.md`), with the riskiest work first: Docker, then the leaked secrets.
4. **Build in phases.**
   - Phase 0: unblock (Docker, secrets)
   - Phase 1: UI/UX
   - Phase 2: label and QR
   - Phase 3: scan locations
   - Phase 4: ship (rebuild, smoke test, docs)
5. **Verify in the real container.** Every change was checked inside the Docker image the team
   will deploy, not only in a dev server.

## 3. Methods and tools

| Method | Used for |
|---|---|
| `planning-and-task-breakdown` skill | Task list with acceptance criteria and checkpoints |
| `ponytail` + `karpathy-guidelines` skills | Smallest working change, no speculative code, surgical edits, a check for every non-trivial piece |
| `frontend-design` skill | Visual direction (palette, type, the one memorable element), checking the plan for generic defaults |
| `frontend-ui-engineering` skill | Accessibility (labels, focus, 44 px targets), loading/empty/error states, responsive layout |
| `ui-ux-pro-max` skill | Its built-in priority rules. Its search database is not installed on this machine, so no database recommendations were used |
| TypeScript `tsc` | Zero type errors before and after every phase |
| Docker build + run | Proves the deployable image works |
| Throwaway Postgres container | Test data, so nothing touched the team's Supabase database |
| `curl` API tests | Scan endpoint, GeoJSON export, auth guards, bad input |
| Playwright screenshots (375 px phone, 1280 px desktop) | Visual review plus automatic checks for horizontal overflow and console errors |
| `scripts/check-storage.ts` (`npm run check:storage`) | Repeatable check of ingredient order and scan storage |

## 4. What was built, and how

### 4.1 Docker deployment (instead of Render)
- **Dockerfile** (rewritten, two stages):
  - The production stage removes the `husky` `prepare` script before `npm ci --omit=dev`.
  - The Supabase `VITE_*` values come in as **build arguments**. Vite bakes them into the
    frontend at build time, and `.env` is excluded from the image.
  - A healthcheck calls `/api/health`.
  - The runtime stage copies the builder's pruned `node_modules`, so it needs no compilers.
    Image size dropped from 1.34 GB to 845 MB.
- **`dotenv`** moved from devDependencies to dependencies, because the server imports it at runtime.
- **`docker-compose.yml`** (new): one `app` service. It reads `.env`, passes the build args,
  exposes port 5000, keeps uploads in a named volume, and restarts automatically.
- **Image uploads:** when no Vercel Blob token is set, images go to the `uploads` volume.
- **Database:** stays on Supabase, because login depends on it. It must be reached through the
  **Session pooler** URL (see section 5, problem 1).
- Removed the duplicate `Dockerfile.new`.

### 4.2 Security
`.env.example` held what looked like the real database password, JWT secret and Sentry DSN, in a
public repository. They were replaced with placeholders and comments.

### 4.3 UI/UX refresh
- **Design tokens:**
  - Colors: grape `#6B1F3A` (primary), plum ink `#241A2B` (text), chalk `#F6F7F8` (background),
    stone `#6A6672` (muted text), vine `#2F6B4F` (verified/organic).
  - Type: *Gloock* for page titles and wine names (it looks like an engraved label) and
    *Public Sans* for everything else (a typeface designed for government forms, which suits a
    compliance tool).
- **Global fixes:**
  - The shadcn `accent` token is the hover color for menus, and it had been set to dark green.
    It is now a light neutral, and a separate `verified` color was added.
  - About 170 hard-coded grey/red/green classes were mapped to semantic tokens.
  - Visible keyboard focus ring; reduced-motion support.
  - Removed the Replit banner script.
- **Navigation:** the links used to disappear on phones with no menu. They now stay visible.
  Added active-page state and screen-reader labels.
- **Landing page:** headline, a three-step explanation, and a live sample label as the hero.
- **Products list:**
  - The table scrolls instead of clipping, and less important columns hide on small screens.
  - The product name is a link to its page.
  - Icon buttons have accessible labels.
  - Added loading, "no products yet" and "no search results" states.
- **Product detail:** replaced six tabs and about 630 lines of repeated markup with one page:
  facts on the left, and a sticky "Bottle label" panel on the right (shown first on phones).
  The page shows the passport ID and EAN, and the Edit button is back.
- **Public passport page (what shoppers see after scanning):**
  - Mobile-first. The identifier is always visible, as the DPP document's UX rule requires.
  - Key facts come first, then ingredients with allergens in bold and a "Contains:" line.
  - The nutrition declaration is a table; warnings use pictograms.
  - Empty sections are hidden instead of printing "Not specified".
- **Login/register/reset:** side margin on phones. Consistent page titles throughout.

### 4.4 Ingredients on products
- New nullable column `products.ingredient_ids integer[]`. Its order is the order printed on the label.
- `IngredientPicker`: tick ingredients in label order. Each row shows its position and an "Allergen" tag.
- The product endpoints return each product's ingredients (name, E-number, allergens) in that order.

### 4.5 Wine-label SVG (`client/src/components/label/WineLabel.tsx`)
- **Size:** 100 × 120 mm, a standard back label for a 750 ml Bordeaux bottle (about 42% of its
  236 mm circumference). Drawn in millimetre units, so it prints at true size.
- **Fixed zones:**
  - brand, name, appellation and vintage
  - ingredients (allergens bold)
  - energy and warning pictograms
  - operator ("Produced and bottled by …"), address, country
  - the **DPP QR code, 25 mm, bottom-right**
  - net volume and % vol
- **Empty field = blank space.** Positions never move.
- **Download label (SVG):** the pictograms are embedded, so the file opens anywhere.

### 4.6 QR code to the product passport
- Generated locally with the `qrcode` package and drawn as vector paths. No third-party website.
- It encodes `BASE_URL/qr/product/<id>?src=qr`. `BASE_URL` comes from the server, so printed codes
  point to the public address even when the dashboard is opened on localhost.
- **Download QR code (SVG)** is also available on its own.

### 4.7 QR scan locations
- New table `scans` (product, latitude, longitude, source, time).
- `POST /api/public/scans` receives scans. It validates coordinates and checks that the product exists.
  - The public page posts one when it is opened from a QR code, but only if the shopper allows
    browser location.
  - The Python QR tool can post the same JSON.
  - Rate limit: 60 scans per IP per minute; more get HTTP 429.
- `GET /api/scans.geojson?key=…` returns a standard GeoJSON FeatureCollection that any map tool can
  open. It is protected by `SCANS_EXPORT_KEY`, because shopper locations are personal data.

### 4.8 Migration and docs
- `server/db/add_ingredients_and_scans.sql`: additive and safe to re-run. Tested twice on the test database.
- README: Docker run steps, pooler explanation, label/QR notes, scan API example.
- DEVELOPMENT.md: the Docker section now points to the README.

## 5. Files

New files:
- `docker-compose.yml`
- `client/src/components/label/WineLabel.tsx`
- `client/src/components/forms/IngredientPicker.tsx`
- `server/db/add_ingredients_and_scans.sql`
- `scripts/check-storage.ts`
- `tasks/plan.md`, `tasks/todo.md`
- `docs/screenshots/*`
- `implementation.md`, `result.md`

Changed files: `Dockerfile`, `.env.example`, `package.json`/lock, `shared/schema.ts`,
`server/routes.ts`, `server/storage.ts`, `client/index.html`, `client/src/index.css`,
`tailwind.config.ts`, `client/src/App.tsx`, plus the pages, tables, navigation and modals listed by
`git status`.

Deleted: `Dockerfile.new`.

Total: 34 files changed (+1360 / −1079 lines), plus 6 new source files.
