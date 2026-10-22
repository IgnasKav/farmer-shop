import { cartFields, mapCart } from "../../../shared/cart"
import { parseOptionId } from "../../../shared/checkout"
import { cartIdFrom, rejectLine } from "../../utils/cart"
import { medusa } from "../../utils/medusa"

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store")
  const cartId = cartIdFrom(event)
  if (!cartId)
    throw createError({ statusCode: 409, statusMessage: "Krepšelis tuščias" })
  let optionId
  try {
    optionId = parseOptionId(await readBody(event))
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Pasirinkite atsiėmimo būdą"
    })
  }
  const { sdk } = medusa()
  try {
    const { cart } = await sdk.store.cart.addShippingMethod(
      cartId,
      { option_id: optionId },
      { fields: cartFields }
    )
    return mapCart(cart)
  } catch (error) {
    return rejectLine(error)
  }
})
