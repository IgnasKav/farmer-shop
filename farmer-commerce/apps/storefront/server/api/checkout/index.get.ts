import { cartFields, mapCart } from "../../../shared/cart"
import { loadCart } from "../../utils/cart"

export default defineEventHandler(async (event) => {
    setHeader(event, "Cache-Control", "no-store")
    const cart = await loadCart(event, `${cartFields},email,*shipping_address`)
    const address = cart?.shipping_address
    return {
        cart: mapCart(cart),
        email: cart?.email || "",
        firstName: address?.first_name || "",
        lastName: address?.last_name || "",
        phone: address?.phone || ""
    }
})
