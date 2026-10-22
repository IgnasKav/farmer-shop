import { cartFields, isLineItemId, mapCart } from "../../../../shared/cart"
import { cartIdFrom, rejectLine } from "../../../utils/cart"
import { medusa } from "../../../utils/medusa"

export default defineEventHandler(async (event) => {
    setHeader(event, "Cache-Control", "no-store")
    const id = getRouterParam(event, "id")
    const cartId = cartIdFrom(event)
    if (!cartId || !isLineItemId(id))
        throw createError({ statusCode: 404, statusMessage: "Krepšelis tuščias" })
    const { sdk } = medusa()
    try {
        const { parent } = await sdk.store.cart.deleteLineItem(cartId, id, {
            fields: cartFields
        })
        return mapCart(parent)
    } catch (error) {
        return rejectLine(error)
    }
})
