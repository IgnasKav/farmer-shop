import assert from "node:assert/strict"

const base = process.env.STOREFRONT_URL || "http://localhost:8000"
async function catalog(query = {}) {
  const response = await fetch(
    `${base}/api/catalog?${new URLSearchParams(query)}`
  )
  assert.equal(response.status, 200)
  return response.json()
}
const first = await catalog()
assert.ok(first.count > 0, "Seed the catalog before running the smoke test")
const all = [...first.products]
for (let page = 2; page <= first.pages; page++) {
  const next = await catalog({ page: String(page) })
  assert.equal(next.count, first.count)
  assert.ok(next.products.length <= 24)
  all.push(...next.products)
}
assert.equal(all.length, first.count)
assert.equal(new Set(all.map((p) => p.id)).size, first.count)
for (let i = 1; i < all.length; i++)
  assert.ok(
    all[i - 1].amount <= all[i].amount,
    "Ascending price order across pages"
  )
const descending = await catalog({ sort: "price-desc" })
assert.equal(descending.products[0].amount, all.at(-1).amount)
for (let i = 1; i < descending.products.length; i++)
  assert.ok(descending.products[i - 1].amount >= descending.products[i].amount)
const category = first.categories.find((c) => c.count > 0)
const filtered = await catalog({ category: category.value })
assert.equal(filtered.count, category.count)
assert.ok(filtered.products.every((p) => p.categories.includes(category.value)))
const target = all[Math.floor(all.length / 2)]
const search = await catalog({ q: target.title })
assert.ok(
  search.products.some((p) => p.id === target.id),
  "Search reaches a product beyond the first page"
)
const detailResponse = await fetch(`${base}/api/products/${target.handle}`)
assert.equal(detailResponse.status, 200)
assert.equal((await detailResponse.json()).id, target.id)
const html = await (await fetch(`${base}/produktai/${target.handle}`)).text()
assert.ok(
  html.includes(target.handle) && html.includes("Apie produktą"),
  "Product page is server-rendered"
)
const home = await (await fetch(base)).text()
assert.ok(home.includes(first.products[0].handle), "Catalog is server-rendered")
assert.equal((await fetch(`${base}/produktai/not-a-real-product`)).status, 404)
assert.equal((await fetch(`${base}/api/catalog?page=-1`)).status, 400)
assert.equal((await fetch(`${base}/api/catalog?sort=newest`)).status, 400)
const empty = await catalog({ q: "zzzzunfindableproductzzzz" })
assert.equal(empty.count, 0)
console.log(
  `PASS: ${all.length} unique products across ${first.pages} pages; global price sorting, category filtering, search, SSR, details, empty state, and invalid requests.`
)
