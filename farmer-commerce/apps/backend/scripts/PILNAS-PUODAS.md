# Pilnas Puodas test catalog

The default `seed` command imports the saved public catalog from https://pilnaspuodas.lt/produktai/ instead of generating 10,000 synthetic products. The initial snapshot contains 662 products with no skipped records. It is fetched through the site's public WooCommerce Store API, with pagination and a delay between requests. No login, cart, or checkout requests are made.

From `C:\main\git\medusa\farmer-commerce\apps\backend`:

```powershell
# Import the included snapshot into your configured local Medusa database.
npm run seed:pilnas-puodas

# Optional: refresh the snapshot from the shop before importing.
npm run scrape:pilnas-puodas

# Offline conversion tests.
npm run test:catalog
```

From the monorepo root, `npm run backend:seed` also imports this catalog. Seed execution is never cached by Turbo. Run only one importer at a time.

The backend needs its normal DATABASE_URL configuration, migrated tables, a default sales channel, a default shipping profile, and EUR enabled in the store. These normally exist after initial Medusa setup. Open http://localhost:9000/app to view the imported products.

## Preview or limit an import

```powershell
$env:PILNAS_SEED_DRY_RUN = "true"
npm run seed:pilnas-puodas
Remove-Item Env:PILNAS_SEED_DRY_RUN

# Optional small import; unset afterward to import everything.
$env:PILNAS_SEED_LIMIT = "5"
npm run seed:pilnas-puodas
Remove-Item Env:PILNAS_SEED_LIMIT
```

Dry run validates the entire snapshot and checks the database prerequisites and existing handles without creating records. `PILNAS_SALES_CHANNEL_ID` can select a channel other than the store default; use the backend command directly when setting these environment variables.

## Data mapping

- Product titles and plain-text descriptions retain Lithuanian characters. Categories are flat and use stable source IDs. Images reference the original public URLs; image files are not downloaded and require the source site to remain available.
- WooCommerce integer minor-unit prices are converted to Medusa v2 EUR amounts (1799 becomes 17.99). Current sale prices are used; original regular prices and source price displays are stored in metadata. These are test prices, with the existing Medusa region/tax configuration determining checkout tax treatment.
- A product priced per kg becomes a single `1 kg` variant with weight 1000 g. A packaged product becomes a `1 vnt.` variant. Variable source package weights/totals are not modeled as selectable variants. No package weight is invented for packaged products.
- All imported products are published with inventory management disabled for test checkout. Actual source availability is stored in metadata, not used as test stock. No orders, customers, or payment data are imported.
- Handles (`pilnas-puodas-ID`), category handles, and SKUs are deterministic. Existing matching products are skipped, so reruns resume partial imports without overwriting edits. Refreshing the snapshot does not update already imported products. Existing demo products are not deleted.
- Unsupported types/options, missing prices, and unrecognized units are recorded in the snapshot's `skipped` list rather than given invented prices. Failed downloads or inconsistent pagination leave the previous snapshot intact.

The scraper and importer use the [WooCommerce Store API](https://developer.woocommerce.com/docs/apis/store-api/resources-endpoints/products/) and [Medusa createProductsWorkflow](https://docs.medusajs.com/resources/references/medusa-workflows/createProductsWorkflow).
