import {
  cartIdFrom,
  forgetCart,
  orderIdFrom,
  rememberOrder,
  statusOf
} from "../../utils/cart"
import { medusa, upstreamError } from "../../utils/medusa"

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store")
  const cartId = cartIdFrom(event)
  if (!cartId) {
    // A repeated submit after success finds no cart but still has the order.
    const orderId = orderIdFrom(event)
    if (orderId) return { orderId }
    throw createError({ statusCode: 409, statusMessage: "Krepšelis tuščias" })
  }
  const { sdk } = medusa()
  let result
  try {
    result = await sdk.store.cart.complete(cartId)
  } catch (error) {
    const status = statusOf(error)
    if (status && status >= 400 && status < 500)
      throw createError({
        statusCode: 409,
        statusMessage:
          "Nepavyko pateikti užsakymo. Patikrinkite krepšelį ir bandykite dar kartą."
      })
    return upstreamError(error)
  }
  if (result.type !== "order")
    throw createError({
      statusCode: 409,
      statusMessage:
        "Nepavyko pateikti užsakymo. Patikrinkite krepšelį ir bandykite dar kartą."
    })
  forgetCart(event)
  rememberOrder(event, result.order.id)
  return { orderId: result.order.id }
})
