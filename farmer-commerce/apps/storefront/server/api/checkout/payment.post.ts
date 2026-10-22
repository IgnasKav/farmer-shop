import { cartIdFrom, rejectLine } from "../../utils/cart"
import { medusa } from "../../utils/medusa"

// No real charge in the first version: the system provider only records the session.
const PROVIDER_ID = "pp_system_default"

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store")
  const cartId = cartIdFrom(event)
  if (!cartId)
    throw createError({ statusCode: 409, statusMessage: "Krepšelis tuščias" })
  const { sdk } = medusa()
  try {
    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: "id,*payment_collection"
    })
    await sdk.store.payment.initiatePaymentSession(cart, {
      provider_id: PROVIDER_ID
    })
    return { ok: true }
  } catch (error) {
    return rejectLine(error)
  }
})
