# Lithuanian farm storefront

Vue 3.5.44 / Nuxt 4.4.2 storefront for the existing Medusa 2.21.2 backend. Nuxt is pinned to a release compatible with the workspace's installed Node 24.14.0. Uses npm and the root workspace lockfile.

## Run locally

The local database must be running. From `C:\main\git\medusa\farmer-commerce`:

```powershell
npm install

# One-time configuration, or rerun to refresh search after bulk changes.
npm run storefront:setup --workspace=@dtc/backend

# If the catalog has not already been imported:
npm run backend:seed

# Start both Medusa and Nuxt.
npm run dev
```

Open http://localhost:8000. Medusa Admin remains at http://localhost:9000/app. If Medusa is already running in another terminal, start only Nuxt with `npm run storefront:dev`.

The setup script reuses or creates a Lithuania/EUR region and a publishable API key linked to the default sales channel. It writes only the public key and region ID to ignored `.medusa-storefront.json`; no Admin credentials are used by the storefront. The new demo region has automatic taxes disabled and uses the manual payment provider. Existing regions are preserved. Checkout and delivery scheduling are outside this catalog milestone.

Alternatively, copy `.env.template` to `.env` in this app and provide `NUXT_MEDUSA_URL`, `NUXT_MEDUSA_PUBLISHABLE_KEY`, and `NUXT_MEDUSA_REGION_ID`. Do not copy backend secrets. Runtime environment variables override the local defaults. Restart Nuxt after running setup or changing configuration. Production starts require the variables to be supplied by the process environment.

## Behavior

- Responsive Lithuanian interface, product images, descriptions, fixed-pack variants, stock indicators, and EUR formatting.
- Flat category list with category-name search. No nested menus or category tree.
- Only ascending and descending price sorting. Medusa's search index sorts the entire matching catalog before fetching each 24-product page; product ID breaks price ties consistently.
- `page`, `q`, `category`, and `sort` live in the URL. Search/filter/sort changes reset the page. Category counts come from scoped search facets, including categories beyond the current page.
- The search endpoint returns IDs; the SDK hydrates only the current page through the Store API with Lithuania region context. The browser never downloads the full catalog.
- Product pages render on demand and unknown handles return HTTP 404. Catalog, product, loading, empty, unavailable-product, and error states are included.
- Store API calls run through Nitro with the official Medusa SDK. No browser-to-backend CORS change is needed. Responses and pages have no storefront response cache. Admin product/variant edits reach search through the existing event subscribers; rerun `storefront:setup` after direct price-list or relation changes that do not emit indexing events. This version uses the seed's base EUR prices; region-specific price lists need a region-aware search price index before use.
- Product image URLs remain hosted by the source shop. The hero uses its carrot photograph. Failed product images show a branded placeholder; Google Fonts have local font fallbacks.
- No payment, order, or delivery actions are presented as functional. The footer and product pages identify this as a demonstration store.

Brand name is configured through `NUXT_PUBLIC_STORE_NAME`; colors and typography are in `app/assets/main.css`.

## Checks

From this app directory:

```powershell
npm test
npm run typecheck
npm run build

# With Medusa and the storefront running:
npm run test:smoke
```

Production preview on Windows:

```powershell
$env:NITRO_PORT = "8000"
npm run start
```

Verified against the local imported catalog: 662 unique products, 28 pages, 66 category facets; ascending prices across every page, descending prices, category filtering, search beyond the first page, server-rendered home/detail pages, product 404, invalid filters, and an empty search. Backend TypeScript and lint checks pass. Browser/mobile interaction and visual checks remain unverified because no browser was connected in the implementation session. No Lighthouse or performance SLA claim is made.
