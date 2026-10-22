import type { H3Event } from "h3"
import { cartFields, cartIdPattern } from "../../shared/cart"
import { medusa, upstreamError } from "./medusa"

const COOKIE = "cart_id"
const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: !import.meta.dev,
    path: "/",
    maxAge: 60 * 60 * 24 * 30
}

export const statusOf = (error: unknown) =>
    (error as { status?: number; statusCode?: number })?.status ??
    (error as { statusCode?: number })?.statusCode

export function cartIdFrom(event: H3Event) {
    const id = getCookie(event, COOKIE)
    return id && cartIdPattern.test(id) ? id : null
}

export function forgetCart(event: H3Event) {
    deleteCookie(event, COOKIE, { path: "/" })
}

export async function loadCart(event: H3Event) {
    const id = cartIdFrom(event)
    if (!id) return null
    const { sdk } = medusa()
    try {
        const { cart } = await sdk.store.cart.retrieve(id, { fields: cartFields })
        if ((cart as { completed_at?: unknown }).completed_at) {
            forgetCart(event)
            return null
        }
        return cart
    } catch (error) {
        if (statusOf(error) === 404) {
            forgetCart(event)
            return null
        }
        return upstreamError(error)
    }
}

export async function createCartId(event: H3Event) {
    const { sdk, region } = medusa()
    const { cart } = await sdk.store.cart.create({ region_id: region })
    setCookie(event, COOKIE, cart.id, cookieOptions)
    return cart.id
}

export function rejectLine(error: unknown): never {
    const status = statusOf(error)
    if (status && status >= 400 && status < 500) {
        throw createError({
            statusCode: status === 404 ? 404 : 400,
            statusMessage: "Nepavyko atnaujinti krepšelio"
        })
    }
    return upstreamError(error)
}
