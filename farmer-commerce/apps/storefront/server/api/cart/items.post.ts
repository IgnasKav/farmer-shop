import { cartFields, mapCart, parseAddItem } from "../../../shared/cart"
import {
    cartIdFrom,
    createCartId,
    rejectLine,
    statusOf
} from "../../utils/cart"
import { medusa } from "../../utils/medusa"

export default defineEventHandler(async (event) => {
    setHeader(event, "Cache-Control", "no-store")
    let input
    try {
        input = parseAddItem(await readBody(event))
    } catch {
        throw createError({
            statusCode: 400,
            statusMessage: "Neteisingi krepšelio duomenys"
        })
    }
    const { sdk } = medusa()
    const add = async (cartId: string) =>
        (
            await sdk.store.cart.createLineItem(
                cartId,
                { variant_id: input.variantId, quantity: input.quantity },
                { fields: cartFields }
            )
        ).cart
    try {
        const existing = cartIdFrom(event)
        if (existing) {
            try {
                return mapCart(await add(existing))
            } catch (error) {
                // An expired or removed cart is replaced; other failures are real.
                if (statusOf(error) !== 404) throw error
            }
        }
        return mapCart(await add(await createCartId(event)))
    } catch (error) {
        return rejectLine(error)
    }
})
