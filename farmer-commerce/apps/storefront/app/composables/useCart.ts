import { emptyCart } from "../../shared/cart"
import type { Cart } from "../../shared/types"

export function useCart() {
    const cart = useState<Cart>("cart", emptyCart)
    const pending = useState("cart-pending", () => false)
    const error = useState<string | null>("cart-error", () => null)
    const isOpen = useState("cart-open", () => false)

    async function run(request: () => Promise<Cart>) {
        pending.value = true
        error.value = null
        try {
            cart.value = await request()
            return true
        } catch (e) {
            error.value =
                (e as { data?: { statusMessage?: string } })?.data?.statusMessage ||
                "Nepavyko atnaujinti krepšelio. Pabandykite dar kartą."
            return false
        } finally {
            pending.value = false
        }
    }

    return {
        cart,
        pending,
        error,
        isOpen,
        refresh: () => run(() => $fetch<Cart>("/api/cart")),
        add: (variantId: string, quantity: number) =>
            run(() =>
                $fetch<Cart>("/api/cart/items", {
                    method: "POST",
                    body: { variantId, quantity }
                })
            ),
        setQuantity: (lineId: string, quantity: number) =>
            run(() =>
                $fetch<Cart>(`/api/cart/items/${lineId}`, {
                    method: "PATCH",
                    body: { quantity }
                })
            ),
        remove: (lineId: string) =>
            run(() =>
                $fetch<Cart>(`/api/cart/items/${lineId}`, { method: "DELETE" })
            )
    }
}
