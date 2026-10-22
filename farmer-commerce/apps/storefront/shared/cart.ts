import type { Cart, CartItem } from "./types"

export const MAX_QUANTITY = 99
export const cartFields =
    "id,completed_at,item_subtotal,subtotal,total,*items"

const variantPattern = /^variant_[A-Za-z0-9]+$/
const linePattern = /^cali_[A-Za-z0-9]+$/
export const cartIdPattern = /^cart_[A-Za-z0-9]+$/

export const emptyCart = (): Cart => ({
    id: null,
    items: [],
    itemCount: 0,
    total: 0
})

export function isLineItemId(id: unknown): id is string {
    return typeof id === "string" && linePattern.test(id)
}

export function parseQuantity(value: unknown, min = 1): number {
    if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < min ||
        value > MAX_QUANTITY
    ) {
        throw new Error("Invalid quantity")
    }
    return value
}

export function parseAddItem(body: unknown) {
    const input = (body ?? {}) as Record<string, unknown>
    if (typeof input.variantId !== "string" || !variantPattern.test(input.variantId))
        throw new Error("Invalid variant")
    return {
        variantId: input.variantId,
        quantity: parseQuantity(input.quantity ?? 1)
    }
}

interface RawItem {
    id: string
    variant_id?: string | null
    product_handle?: string | null
    product_title?: string | null
    title?: string | null
    variant_title?: string | null
    thumbnail?: string | null
    quantity?: number | null
    unit_price?: number | null
    total?: number | null
}
interface RawCart {
    id: string
    total?: number | null
    item_subtotal?: number | null
    items?: (RawItem | null)[] | null
}

const num = (value: unknown) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
}

export function mapCart(cart: RawCart | null | undefined): Cart {
    if (!cart) return emptyCart()
    const items: CartItem[] = (cart.items || []).flatMap((i) =>
        i
            ? [
                {
                    id: i.id,
                    variantId: i.variant_id || "",
                    productHandle: i.product_handle || "",
                    title: i.product_title || i.title || "",
                    variantTitle: i.variant_title || "",
                    thumbnail: i.thumbnail || null,
                    quantity: num(i.quantity),
                    unitPrice: num(i.unit_price),
                    total: num(i.total) || num(i.unit_price) * num(i.quantity)
                }
            ]
            : []
    )
    return {
        id: cart.id,
        items,
        itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        total: num(cart.total) || num(cart.item_subtotal)
    }
}
