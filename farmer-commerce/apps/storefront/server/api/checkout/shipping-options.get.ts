import type { ShippingOption } from "../../../shared/types"
import { cartIdFrom, rejectLine } from "../../utils/cart"
import { medusa } from "../../utils/medusa"

export default defineEventHandler(async (event): Promise<ShippingOption[]> => {
  setHeader(event, "Cache-Control", "no-store")
  const cartId = cartIdFrom(event)
  if (!cartId)
    throw createError({ statusCode: 409, statusMessage: "Krepšelis tuščias" })
  const { sdk } = medusa()
  try {
    const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
      cart_id: cartId
    })
    return (shipping_options || []).map((o) => ({
      id: o.id,
      name: o.name,
      description: o.type?.description || "",
      amount: Number(o.calculated_price?.calculated_amount ?? o.amount ?? 0)
    }))
  } catch (error) {
    return rejectLine(error)
  }
})
