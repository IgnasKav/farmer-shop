import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createApiKeysWorkflow, createRegionsWorkflow, linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"

export default async function setupStorefront({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { data: stores } = await query.graph({ entity: "store", fields: ["default_sales_channel_id"] })
  const channel = stores[0]?.default_sales_channel_id
  if (!channel) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Configure the store's default sales channel first")
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "currency_code", "countries.iso_2"] })
  let region: { id: string } | undefined = regions.find((r) => r.currency_code === "eur" && r.countries?.some((c) => c?.iso_2 === "lt"))
  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({ input: { regions: [{
      name: "Lietuva (demonstracinė)", currency_code: "eur", countries: ["lt"], automatic_taxes: false,
      payment_providers: ["pp_system_default"],
    }] } })
    region = result[0]
  }
  const { data: keys } = await query.graph({
    entity: "api_key", fields: ["id", "token", "title", "revoked_at", "sales_channels.id"],
    filters: { type: "publishable" },
  })
  let key: { id: string; token: string; sales_channels?: ({ id: string } | null)[] | null } | undefined = keys.find((k) => k.title === "Nuxt local storefront" && !k.revoked_at)
  if (!key) {
    const { result } = await createApiKeysWorkflow(container).run({ input: { api_keys: [{
      title: "Nuxt local storefront", type: "publishable", created_by: "",
    }] } })
    key = { ...result[0], sales_channels: [] }
  }
  if (!key || !region) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Could not configure storefront")
  if (!key.sales_channels?.some((c) => c?.id === channel)) {
    await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channel] } })
  }
  const directory = path.resolve(process.cwd(), "../storefront")
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, ".medusa-storefront.json"), JSON.stringify({
    publishable_key: key.token, region_id: region.id,
  }, null, 2) + "\n")
  const search = container.resolve(Modules.SEARCH)
  let count = 0
  for (let skip = 0; ; skip += 50) {
    const { data } = await query.graph({ entity: "product", fields: ["id"], pagination: { skip, take: 50, order: { id: "ASC" } } })
    if (!data.length) break
    await search.ingest({ name: "product.updated", data: data.map((p) => ({ id: p.id })) })
    count += data.length
  }
  logger.info(`Storefront configured for Lithuania/EUR. Refreshed ${count} products in search. Local public configuration saved without printing credentials.`)
}
