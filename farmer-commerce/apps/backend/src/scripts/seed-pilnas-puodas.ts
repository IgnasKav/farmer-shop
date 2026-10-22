import { readFile } from "node:fs/promises"
import path from "node:path"
import { z } from "@medusajs/framework/zod"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules, ProductStatus } from "@medusajs/framework/utils"
import { createProductCategoriesWorkflow, createProductsWorkflow } from "@medusajs/medusa/core-flows"

const categorySchema = z.object({ source_id: z.number().int().positive(), name: z.string().min(1) })
const snapshotSchema = z.object({
  schema_version: z.literal(1),
  source: z.literal("https://pilnaspuodas.lt/produktai/"),
  fetched_at: z.string().datetime(),
  source_count: z.number().int().positive(),
  skipped: z.array(z.object({ id: z.number(), reason: z.string() })),
  products: z.array(z.object({
    source_id: z.number().int().positive(),
    source_url: z.string().url(),
    source_sku: z.string().nullable(),
    title: z.string().min(1),
    description: z.string(),
    amount: z.number().positive().finite(),
    regular_amount: z.number().nonnegative().finite(),
    currency_code: z.literal("eur"),
    unit: z.enum(["kg", "item"]),
    source_price_display: z.string(),
    source_in_stock: z.boolean(),
    images: z.array(z.string().url()),
    categories: z.array(categorySchema),
  })).min(1),
})

const BATCH_SIZE = 25

export default async function seedPilnasPuodas({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const snapshot = snapshotSchema.parse(JSON.parse(await readFile(
    path.resolve(process.cwd(), "src/scripts/data/pilnas-puodas.json"), "utf8"
  )))
  if (new Set(snapshot.products.map((p) => p.source_id)).size !== snapshot.products.length ||
      snapshot.products.length + snapshot.skipped.length !== snapshot.source_count) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Snapshot has duplicate IDs or an inconsistent product count")
  }
  const limit = process.env.PILNAS_SEED_LIMIT ? Number(process.env.PILNAS_SEED_LIMIT) : snapshot.products.length
  if (!Number.isInteger(limit) || limit < 1) throw new MedusaError(MedusaError.Types.INVALID_DATA, "PILNAS_SEED_LIMIT must be a positive integer")
  const dryRun = process.env.PILNAS_SEED_DRY_RUN === "true"
  const products = snapshot.products.slice(0, limit)
  const { data: stores } = await query.graph({
    entity: "store", fields: ["id", "default_sales_channel_id", "supported_currencies.currency_code"],
  })
  const store = stores[0]
  const channelId = process.env.PILNAS_SALES_CHANNEL_ID || store?.default_sales_channel_id
  if (!channelId || !store?.supported_currencies?.some((c) => c?.currency_code === "eur")) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Configure a default sales channel and EUR currency in Medusa before seeding")
  }
  const { data: channels } = await query.graph({
    entity: "sales_channel", fields: ["id"], filters: { id: channelId },
  })
  const { data: profiles } = await query.graph({
    entity: "shipping_profile", fields: ["id", "type"], filters: { type: "default" },
  })
  if (!channels.length || !profiles.length) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Sales channel or default shipping profile not found")

  const sourceCategories = new Map(products.flatMap((p) => p.categories).map((c) => [c.source_id, c]))
  const categoryIds = new Map<number, string>()
  for (const category of sourceCategories.values()) {
    const handle = `pilnas-puodas-category-${category.source_id}`
    const { data: existing } = await query.graph({
      entity: "product_category", fields: ["id"], filters: { handle },
    })
    if (existing.length) categoryIds.set(category.source_id, existing[0].id)
    else if (!dryRun) {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: { product_categories: [{ name: category.name, handle, is_active: true, is_internal: false }] },
      })
      categoryIds.set(category.source_id, result[0].id)
    }
  }

  let created = 0
  let skipped = 0
  for (let offset = 0; offset < products.length; offset += BATCH_SIZE) {
    const batch = products.slice(offset, offset + BATCH_SIZE)
    const { data: existing } = await query.graph({
      entity: "product", fields: ["id", "handle"],
      filters: { handle: batch.map((p) => `pilnas-puodas-${p.source_id}`) },
    })
    const handles = new Set(existing.map((p) => p.handle))
    const missing = batch.filter((p) => !handles.has(`pilnas-puodas-${p.source_id}`))
    skipped += batch.length - missing.length
    if (dryRun) {
      created += missing.length
      continue
    }
    let ids = existing.map((p) => p.id)
    if (missing.length) {
      const { result } = await createProductsWorkflow(container).run({
        input: { products: missing.map((p) => {
          const unit = p.unit === "kg" ? "1 kg" : "1 vnt."
          return {
            title: p.title,
            handle: `pilnas-puodas-${p.source_id}`,
            description: p.description,
            status: ProductStatus.PUBLISHED,
            thumbnail: p.images[0],
            images: p.images.map((url) => ({ url })),
            shipping_profile_id: profiles[0].id,
            sales_channels: [{ id: channelId }],
            category_ids: p.categories.map((c) => categoryIds.get(c.source_id)!),
            options: [{ title: "Vienetas", values: [unit] }],
            variants: [{
              title: unit,
              sku: `PILNAS-PUODAS-${p.source_id}`,
              manage_inventory: false,
              options: { Vienetas: unit },
              prices: [{ currency_code: "eur", amount: p.amount }],
              ...(p.unit === "kg" ? { weight: 1000 } : {}),
            }],
            metadata: {
              test_data: true,
              source: snapshot.source,
              source_id: p.source_id,
              source_url: p.source_url,
              source_sku: p.source_sku,
              source_fetched_at: snapshot.fetched_at,
              source_in_stock: p.source_in_stock,
              source_price_display: p.source_price_display,
              source_regular_price_eur: p.regular_amount,
              price_unit: p.unit,
              inventory_policy: "unlimited test stock",
            },
          }
        }) },
      })
      ids = ids.concat(result.map((p) => p.id))
      created += result.length
    }
    // Await search ingestion before the short-lived exec process exits.
    // Include skipped products so a rerun also repairs interrupted ingestion.
    if (ids.length && container.hasRegistration(Modules.SEARCH)) {
      const search = container.resolve(Modules.SEARCH)
      await search.ingest({ name: "product.created", data: ids.map((id) => ({ id })) })
    }
    logger.info(`Processed ${Math.min(offset + BATCH_SIZE, products.length)}/${products.length}`)
  }
  logger.info(`${dryRun ? "Dry run: would create" : "Created"} ${created} products; skipped ${skipped} existing products; ${snapshot.skipped.length} unsupported source records. Categories: ${sourceCategories.size}.`)
}
