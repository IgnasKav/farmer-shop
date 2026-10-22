import Medusa from "@medusajs/js-sdk"
import type { HttpTypes } from "@medusajs/types"
import type { Product } from "../../shared/types"

export function medusa() {
  const config = useRuntimeConfig()
  if (!config.medusaPublishableKey || !config.medusaRegionId) {
    throw createError({
      statusCode: 503,
      statusMessage: "Parduotuvė dar ruošiama. Pabandykite vėliau."
    })
  }
  return {
    sdk: new Medusa({
      baseUrl: config.medusaUrl,
      publishableKey: config.medusaPublishableKey
    }),
    region: config.medusaRegionId
  }
}
export const productFields =
  "id,handle,title,description,thumbnail,metadata,*images,*categories,*variants,*variants.calculated_price,+variants.inventory_quantity"

export function mapProduct(p: HttpTypes.StoreProduct): Product {
  const variants = (p.variants || []).map((v) => ({
    id: v.id,
    title: v.title || "1 vnt.",
    amount:
      typeof v.calculated_price?.calculated_amount === "number"
        ? v.calculated_price.calculated_amount
        : null,
    available:
      !v.manage_inventory ||
      !!v.allow_backorder ||
      (v.inventory_quantity ?? 0) > 0
  }))
  const prices = variants.flatMap((v) => (v.amount === null ? [] : [v.amount]))
  return {
    id: p.id,
    handle: p.handle || p.id,
    title: p.title,
    description: p.description || "",
    thumbnail: p.thumbnail || null,
    images: (p.images || []).map((i) => i.url),
    categories: (p.categories || []).map((c) => c.name),
    variants,
    amount: prices.length ? Math.min(...prices) : null,
    unit:
      p.metadata?.price_unit === "kg"
        ? "1 kg"
        : variants.length === 1
          ? variants[0]!.title
          : "Pasirenkamas dydis",
    available: variants.some((v) => v.available && v.amount !== null)
  }
}
export function upstreamError(error: unknown): never {
  console.error(
    "Medusa storefront request failed",
    error instanceof Error ? error.message : "Unknown error"
  )
  throw createError({
    statusCode: 502,
    statusMessage: "Nepavyko pasiekti parduotuvės. Pabandykite dar kartą."
  })
}
