At the top right corner display a cart button, on hover it should show a smooth rounded dialog with the prodcuts inside.

# Plan: add-to-cart for the storefront

## Scope

- Cart UI is a **drawer/dialog** (no separate cart page). Per the note above, the header cart button shows a smooth, rounded dialog with the products. On hover on desktop; on click/tap and keyboard focus for touch and accessibility.
- First version has **no checkout**. The dialog ends at the subtotal with a disabled checkout button.
- **No quick-add** on product cards. Items are added only from the product page.

## Current state

The Nuxt app talks to Medusa only through server routes (`server/api/*`), using `server/utils/medusa.ts`. The publishable key and region ID live in the server-only runtime config. Products and variant IDs are already mapped. The region (LT/EUR) and `pp_system_default` payment provider already exist.

## Design decision

Keep the Medusa key off the browser. The browser calls Nuxt server routes, which call Medusa. The cart ID is stored in an `HttpOnly`, `SameSite=Lax` cookie, so browser scripts never see it.

## 1. Server layer

1. Add `server/api/cart/` routes:
   - `GET /api/cart` - reads the cart ID from the cookie, retrieves the cart and returns a mapped `Cart`. If the cart is gone or completed, clears the cookie and returns an empty cart.
   - `POST /api/cart/items` - takes `{ variantId, quantity }`. If there is no cart, creates one with `region_id` (`sdk.store.cart.create`) and sets the cookie. Then calls `sdk.store.cart.createLineItem`.
   - `PATCH /api/cart/items/[id]` - updates the quantity. A quantity of 0 removes the line.
   - `DELETE /api/cart/items/[id]` - removes the line.
2. Validate input with zod: `variantId` must match the expected ID pattern, `quantity` must be an integer from 1 to 99. Report upstream failures through the existing `upstreamError`.
3. Add `mapCart` and a `cartFields` string to `medusa.ts`. Map line items to `id, variantId, productHandle, title, variantTitle, thumbnail, quantity, unitPrice, total`, plus `subtotal`, `total` and `itemCount`.
4. Add the `Cart` and `CartItem` types to `shared/types.ts`.

## 2. Client state

1. Add `app/composables/useCart.ts`. It uses `useState` for the cart and exposes `cart`, `pending`, `error`, `isOpen`, `add`, `setQuantity`, `remove`, `refresh`, `open` and `close`. The cart loads once on app start.
2. Mutations update the cart from the server response, not from a client-side guess.

## 3. UI

1. **Product page** (`[handle].vue`):
   - Quantity stepper plus an "Į krepšelį" button next to the price.
   - The button is disabled when `variant.available` is false or the price is null.
   - Shows a pending state while the request runs, then opens the cart dialog (or shows an `aria-live` confirmation).
   - The variant selector already exists; the chosen variant's `id` is passed to `add`.
2. **Header** (`app.vue`): a cart button at the top right with an item-count badge that opens the cart dialog.
3. **Cart dialog** (`app/components/CartDrawer.vue`):
   - Smooth open/close transition, rounded corners.
   - Lists items with thumbnail, title, variant, quantity stepper, line total and remove button, followed by the subtotal.
   - Has an empty state and an error state.
   - The checkout button is disabled with a short note that orders are not accepted yet.
   - Accessibility: focus trap when opened by click, close on Escape and on outside click, labels on the steppers, visible focus outlines, `aria-live` for updates. Hover must not be the only way to open it.
4. Tailwind only, matching the rest of the refactored storefront. All new copy in Lithuanian.

## 4. Backend and data checks

- The publishable key must be linked to the default sales channel (done by `setup-storefront.ts`) and products must be in that channel (done by the seed).
- Seeded variants use `manage_inventory: false`, so stock is not checked. If inventory is turned on later, `available` already handles it.
- Prices come from `calculated_price` in the cart region, so line totals match the catalogue.

## 5. Testing

- Unit tests for `mapCart` and the zod validation, in the style of `tests/catalog.test.mjs`.
- Extend `tests/smoke.mjs`: add an item, change its quantity, remove it, and check the cookie flags (`HttpOnly`).
- Manual checks: invalid or expired cart cookie, unavailable variant, rapid double clicks, mobile layout, keyboard-only use of the dialog.

## 6. Order of work

1. Types, `mapCart`, API routes and tests.
2. `useCart` composable.
3. Add button and quantity on the product page, plus the header badge.
4. Cart dialog.

## Out of scope (later)

Checkout: email, shipping address, shipping option, payment, and `cart.complete`. This also needs shipping options and fulfilment set up in the backend, which the seed does not do today. Orders are currently not accepted, so confirm the shop wants to start taking them before planning this.
