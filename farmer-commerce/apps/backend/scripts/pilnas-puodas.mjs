// Keep this conversion separate so price and unit handling can be tested offline.
export function plainText(html = "") {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", euro: "€", ndash: "–", mdash: "—", times: "×", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”" }
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, key) => {
      if (!key.startsWith("#")) return entities[key.toLowerCase()] ?? match
      const value = key[1].toLowerCase() === "x" ? parseInt(key.slice(2), 16) : Number(key.slice(1))
      return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : match
    }).replace(/\s+/g, " ").trim()
}

export function normalizeProduct(product) {
  if (product.type !== "simple" || product.has_options || product.variations?.length) {
    throw new Error(`Unsupported product type/options: ${product.type}`)
  }
  const { price, regular_price, currency_code, currency_minor_unit } = product.prices ?? {}
  if (currency_code !== "EUR" || !Number.isInteger(currency_minor_unit) || currency_minor_unit !== 2 || !/^\d+$/.test(price ?? "")) {
    throw new Error("Missing or unsupported EUR price")
  }
  const amount = Number(price) / 10 ** currency_minor_unit
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid or zero price")
  if (!Number.isInteger(product.id) || !plainText(product.name)) throw new Error("Missing product ID/title")
  const priceText = plainText(product.price_html)
  // Weighted items expose a per-kg price, not the variable package total.
  const unit = /\/\s*kg\b/i.test(priceText) ? "kg" : /\/\s*vnt\./i.test(priceText) ? "item" : null
  if (!unit) throw new Error(`Unrecognized price unit: ${priceText}`)
  return {
    source_id: product.id,
    source_url: product.permalink,
    source_sku: product.sku || null,
    title: plainText(product.name),
    description: plainText(product.description || product.short_description),
    amount,
    regular_amount: /^\d+$/.test(regular_price ?? "") ? Number(regular_price) / 100 : amount,
    currency_code: "eur",
    unit,
    source_price_display: priceText,
    source_in_stock: Boolean(product.is_in_stock),
    images: [...new Set((product.images ?? []).map((image) => image.src))],
    categories: (product.categories ?? []).map((category) => ({
      source_id: category.id, name: plainText(category.name),
    })),
  }
}
