import {
    cartFields,
    isLineItemId,
    mapCart,
    parseQuantity
} from "../../../../shared/cart"
import { cartIdFrom, rejectLine } from "../../../utils/cart"
import { medusa } from "../../../utils/medusa"

export default defineEventHandler(async (event) => {
    setHeader(event, "Cache-Control", "no-store")
    const id = getRouterParam(event, "id")
    const cartId = cartIdFrom(event)
    if (!cartId || !isLineItemId(id))
        throw createError({ statusCode: 404, statusMessage: "Krepšelis tuščias" })
    let quantity
    try {
        quantity = parseQuantity(((await readBody(event)) ?? {}).quantity, 0)
    } catch {
        throw createError({
            statusCode: 400,
            statusMessage: "Neteisingi krepšelio duomenys"
        })
    }
    const { sdk } = medusa()
    try {
        if (quantity === 0) {
            const { parent } = await sdk.store.cart.deleteLineItem(cartId, id, {
                fields: cartFields
            })
            return mapCart(parent)
        }
        const { cart } = await sdk.store.cart.updateLineItem(
            cartId,
            id,
            { quantity },
            { fields: cartFields }
        )
        return mapCart(cart)
    } catch (error) {
        return rejectLine(error)
    }
})
