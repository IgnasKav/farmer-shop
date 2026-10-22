import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import {
    createShippingOptionsWorkflow,
    createStockLocationsWorkflow,
    linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

const SET_NAME = "Atsiėmimas Lietuvoje"
const OPTION_NAME = "Atsiėmimas ūkyje"

// Idempotent: creates the Lithuanian pickup zone and a free pickup option.
export default async function setupCheckout({ container }: ExecArgs) {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const fulfillment = container.resolve(Modules.FULFILLMENT)

    const { data: stores } = await query.graph({ entity: "store", fields: ["default_sales_channel_id"] })
    const channelId = stores[0]?.default_sales_channel_id
    if (!channelId) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Configure the store's default sales channel first")

    const { data: regions } = await query.graph({ entity: "region", fields: ["id", "currency_code", "countries.iso_2"] })
    const region = regions.find((r) => r.currency_code === "eur" && r.countries?.some((c) => c?.iso_2 === "lt"))
    if (!region) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Run storefront:setup first to create the Lithuanian region")

    const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id"], filters: { type: "default" } })
    if (!profiles.length) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Default shipping profile not found")

    const { data: locations } = await query.graph({ entity: "stock_location", fields: ["id", "sales_channels.id"] })
    let location: { id: string; sales_channels?: ({ id: string } | null)[] | null } | undefined = locations[0]
    if (!location) {
        const { result } = await createStockLocationsWorkflow(container).run({
            input: { locations: [{ name: "Ūkio krautuvė", address: { city: "", country_code: "LT", address_1: "" } }] },
        })
        location = { id: result[0].id, sales_channels: [] }
    }
    if (!location.sales_channels?.some((c) => c?.id === channelId)) {
        await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [channelId] } })
    }

    const { data: sets } = await query.graph({
        entity: "fulfillment_set", fields: ["id", "service_zones.id"], filters: { name: SET_NAME },
    })
    let zoneId = sets[0]?.service_zones?.[0]?.id
    if (!zoneId) {
        const set = await fulfillment.createFulfillmentSets({
            name: SET_NAME,
            type: "pickup",
            service_zones: [{ name: "Lietuva", geo_zones: [{ country_code: "lt", type: "country" }] }],
        })
        zoneId = set.service_zones[0].id
        await link.create({
            [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
            [Modules.FULFILLMENT]: { fulfillment_set_id: set.id },
        })
    }

    const { data: options } = await query.graph({ entity: "shipping_option", fields: ["id"], filters: { name: OPTION_NAME } })
    if (!options.length) {
        await createShippingOptionsWorkflow(container).run({
            input: [{
                name: OPTION_NAME,
                price_type: "flat",
                provider_id: "manual_manual",
                service_zone_id: zoneId,
                shipping_profile_id: profiles[0].id,
                type: { label: "Atsiėmimas", description: "Atsiimkite užsakymą ūkyje.", code: "pickup" },
                prices: [{ currency_code: "eur", amount: 0 }, { region_id: region.id, amount: 0 }],
                rules: [
                    { attribute: "enabled_in_store", value: "true", operator: "eq" },
                    { attribute: "is_return", value: "false", operator: "eq" },
                ],
            }],
        })
    }
    logger.info("Checkout configured: free pickup option available for Lithuania.")
}
