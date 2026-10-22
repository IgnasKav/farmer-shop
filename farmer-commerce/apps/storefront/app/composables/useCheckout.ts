import { emptyCart } from "../../shared/cart"
import type { CheckoutDetails } from "../../shared/checkout"
import type { ShippingOption } from "../../shared/types"

export function useCheckout() {
    const { cart } = useCart()
    const submitting = ref(false)
    const error = ref<string | null>(null)

    async function place(details: CheckoutDetails) {
        if (submitting.value) return null
        submitting.value = true
        error.value = null
        try {
            await $fetch("/api/checkout/details", { method: "PUT", body: details })
            const options = await $fetch<ShippingOption[]>(
                "/api/checkout/shipping-options"
            )
            if (!options[0]) {
                error.value = "Atsiėmimo būdas šiuo metu nepasiekiamas. Pabandykite vėliau."
                return null
            }
            await $fetch("/api/checkout/shipping", {
                method: "POST",
                body: { optionId: options[0].id }
            })
            await $fetch("/api/checkout/payment", { method: "POST" })
            const { orderId } = await $fetch<{ orderId: string }>(
                "/api/checkout/complete",
                { method: "POST" }
            )
            cart.value = emptyCart()
            return orderId
        } catch (e) {
            error.value =
                (e as { data?: { statusMessage?: string } })?.data?.statusMessage ||
                "Nepavyko pateikti užsakymo. Pabandykite dar kartą."
            return null
        } finally {
            submitting.value = false
        }
    }

    return { submitting, error, place }
}
