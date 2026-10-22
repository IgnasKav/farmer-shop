import test from "node:test"
import assert from "node:assert/strict"
import { normalizeProduct, plainText } from "./pilnas-puodas.mjs"

const product = {
  id: 1032, name: "Šamo filė", type: "simple", has_options: false,
  prices: { price: "1799", regular_price: "1999", currency_code: "EUR", currency_minor_unit: 2 },
  price_html: '<span>5.04 &euro; – 6.84 &euro; / vnt.</span><span>17.99 €</span> / kg',
}
test("keeps per-kg price distinct from the variable package range", () => {
  const item = normalizeProduct(product)
  assert.equal(item.amount, 17.99)
  assert.equal(item.regular_amount, 19.99)
  assert.equal(item.unit, "kg")
})
test("uses current sale price in euros for a packaged product", () => {
  const item = normalizeProduct({ ...product, price_html: "<del>19.99 €</del> 17.99 € / vnt." })
  assert.equal(item.unit, "item")
  assert.equal(item.amount, 17.99)
})
test("rejects missing prices, unknown units, and variable products", () => {
  assert.throws(() => normalizeProduct({ ...product, prices: { ...product.prices, price: "" } }))
  assert.throws(() => normalizeProduct({ ...product, price_html: "17.99 € / l" }))
  assert.throws(() => normalizeProduct({ ...product, type: "variable" }))
})
test("preserves Lithuanian and decodes HTML entities without retaining markup", () => {
  assert.equal(plainText("<p>Šviežia &#8211; &#x17E;uvis &amp; sūris&nbsp;</p>"), "Šviežia – žuvis & sūris")
})
