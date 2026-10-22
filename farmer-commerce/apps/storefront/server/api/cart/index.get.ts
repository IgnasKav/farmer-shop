import { mapCart } from "../../../shared/cart"
import { loadCart } from "../../utils/cart"

export default defineEventHandler(async (event) => {
    setHeader(event, "Cache-Control", "no-store")
    return mapCart(await loadCart(event))
})
