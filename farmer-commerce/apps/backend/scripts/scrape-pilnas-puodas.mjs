import { mkdir, writeFile, rename } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import { normalizeProduct } from "./pilnas-puodas.mjs"

const endpoint = "https://pilnaspuodas.lt/wp-json/wc/store/v1/products"
const output = fileURLToPath(new URL("../src/scripts/data/pilnas-puodas.json", import.meta.url))

async function fetchPage(page) {
  const url = new URL(endpoint)
  url.search = new URLSearchParams({
    per_page: "100", page: String(page), catalog_visibility: "catalog",
    orderby: "id", order: "asc",
  }).toString()
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
        headers: { "User-Agent": "FarmerCommerceTestCatalog/1.0", Accept: "application/json" },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
      const products = await response.json()
      const total = Number(response.headers.get("x-wp-total"))
      const pages = Number(response.headers.get("x-wp-totalpages"))
      if (!Array.isArray(products) || !Number.isInteger(pages) || pages < 1 || !total) {
        throw new Error("Invalid catalog response or missing pagination headers")
      }
      return { products, total, pages }
    } catch (error) {
      if (attempt === 2) throw error
      await delay(2000 * (attempt + 1))
    }
  }
}

const first = await fetchPage(1)
const raw = [...first.products]
console.log(`Catalog: ${first.total} products across ${first.pages} pages`)
for (let page = 2; page <= first.pages; page++) {
  await delay(750)
  const next = await fetchPage(page)
  if (next.total !== first.total || next.pages !== first.pages) {
    throw new Error("Catalog changed during scraping; rerun to get a consistent snapshot")
  }
  raw.push(...next.products)
  console.log(`Downloaded page ${page}/${first.pages}`)
}
if (raw.length !== first.total || new Set(raw.map((p) => p.id)).size !== first.total) {
  throw new Error("Incomplete or duplicate catalog; previous snapshot was preserved")
}

const products = []
const skipped = []
for (const product of raw) {
  try {
    products.push(normalizeProduct(product))
  } catch (error) {
    skipped.push({ id: product.id, name: product.name, reason: error.message })
  }
}
if (!products.length) throw new Error("No importable products found")
const snapshot = {
  schema_version: 1,
  source: "https://pilnaspuodas.lt/produktai/",
  endpoint,
  fetched_at: new Date().toISOString(),
  source_count: first.total,
  products,
  skipped,
}
await mkdir(dirname(output), { recursive: true })
await writeFile(`${output}.tmp`, JSON.stringify(snapshot, null, 2) + "\n", "utf8")
await rename(`${output}.tmp`, output)
console.log(`Saved ${products.length} products; skipped ${skipped.length}. Snapshot: ${output}`)
for (const item of skipped) console.warn(`Skipped ${item.id}: ${item.reason}`)
