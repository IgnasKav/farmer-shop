import { cartFields, mapCart } from "../../../shared/cart"
import { parseDetails } from "../../../shared/checkout"
import { loadCart, rejectLine } from "../../utils/cart"
import { medusa } from "../../utils/medusa"

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store")
  let details
  try {
    details = parseDetails(await readBody(event))
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Patikrinkite įvestus duomenis"
    })
  }
  const cart = await loadCart(event)
  if (!cart || !cart.items?.length)
    throw createError({ statusCode: 409, statusMessage: "Krepšelis tuščias" })

  // Pickup has no customer address, but Medusa needs a country to match the zone.
  const pickup = useRuntimeConfig(event).public.pickup
  const address = {
    first_name: details.firstName,
    last_name: details.lastName,
    phone: details.phone,
    address_1: pickup.address || pickup.name,
    city: pickup.city,
    postal_code: pickup.postalCode,
    country_code: "lt"
  }
  const { sdk } = medusa()
  try {
    const { cart: updated } = await sdk.store.cart.update(
      cart.id,
      { email: details.email, shipping_address: address, billing_address: address },
      { fields: cartFields }
    )
    return mapCart(updated)
  } catch (error) {
    return rejectLine(error)
  }
})
