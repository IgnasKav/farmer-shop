import { mapItems } from "../../../shared/cart"
import { orderIdPattern } from "../../../shared/checkout"
import type { Order } from "../../../shared/types"
import { orderIdFrom, statusOf } from "../../utils/cart"
import { medusa, upstreamError } from "../../utils/medusa"

export default defineEventHandler(async (event): Promise<Order> => {
  setHeader(event, "Cache-Control", "no-store")
  const id = getRouterParam(event, "id")
  if (!id || !orderIdPattern.test(id) || id !== orderIdFrom(event))
    throw createError({ statusCode: 404, statusMessage: "Užsakymas nerastas" })
  const { sdk } = medusa()
  try {
    const { order } = await sdk.store.order.retrieve(id, {
      fields: "id,display_id,email,total,*items"
    })
    return {
      id: order.id,
      displayId: order.display_id ?? null,
      email: order.email || "",
      total: Number(order.total) || 0,
      items: mapItems(order.items)
    }
  } catch (error) {
    if (statusOf(error) === 404)
      throw createError({ statusCode: 404, statusMessage: "Užsakymas nerastas" })
    return upstreamError(error)
  }
})
