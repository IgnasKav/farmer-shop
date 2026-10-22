# Plan: checkout for the storefront

Builds on `add-to-cart-functinality.md`. The cart dialog currently ends with a disabled "Apmokėjimas — netrukus" button. This plan makes it work and lets customers place an order.

## Decisions (confirmed)

- **Delivery:** farm **pickup only** for the first version, free. No courier and no customer delivery address.
- **VAT:** displayed prices **already include VAT**. The region keeps `automatic_taxes: false`, so the price the customer sees is the price charged and no tax region is needed in v1. A VAT breakdown on invoices is a later step.
- **Payment:** the first version **accepts orders without any real charge** (`pp_system_default`). Nothing is collected, so the confirmation and wording must not suggest that payment was taken (for example "Apmokėsite atsiimdami").

## Scope

- Guest checkout only (no customer accounts).
- One page, `/apmokejimas`, with contact details, pickup, payment, and an order summary.
- A confirmation page, `/uzsakymas/[id]`, after the order is placed.
- Out of scope: accounts, discount codes, returns, order history, emails beyond the default, multiple regions or currencies, courier delivery, real payments.

## Current state (what exists, what is missing)

- Storefront: cart routes under `server/api/cart/*`, the `HttpOnly` `cart_id` cookie, `useCart`, and `CartDrawer.vue`. Prices are in EUR for the Lithuanian region (`medusaRegionId`).
- Region: `setup-storefront.ts` creates "Lietuva (demonstracinė)", EUR, country `lt`, with the `pp_system_default` payment provider and `automatic_taxes: false`.
- **Gap: delivery.** The shipping options in `initial-data-seed.ts` belong to a service zone for gb, de, dk, se, fr, es and it. **Lithuania is not covered**, so the pickup option has to be created for a Lithuanian zone first.
- **Tax:** not needed in v1 (prices include VAT, `automatic_taxes: false`).
- Stock: seeded variants use `manage_inventory: false`, so completing a cart does not need stock reservations.

## Design decisions

- Same pattern as the cart: the browser calls Nuxt server routes and the Medusa key and cart ID stay server-side.
- The cart ID cookie stays `HttpOnly`. After the order is placed the cookie is cleared.
- The order confirmation is shown from data returned by the complete call and a short-lived signed cookie (or the order ID plus the order's own email check). The order ID alone must not expose personal data to anyone who guesses a URL.
- Each step is validated on the server (not only in the form) with the same hand-written validators in `shared/` that the cart uses, so they can be unit tested.

## 1. Backend (Medusa) setup

1. Add a script `src/scripts/setup-checkout.ts` (idempotent, same style as `setup-storefront.ts`) that:
   - creates a fulfillment set and a service zone with `lt` as the geo zone, linked to the existing stock location;
   - creates **one** shipping option for that zone: "Atsiėmimas ūkyje" (pickup), flat price 0 EUR, `manual_manual` provider, default shipping profile;
   - makes sure the sales channel is linked to the stock location;
   - stores the pickup address in configuration (an environment variable or a small config file) so the storefront can show it and put it on the cart.
2. Confirm the region has `pp_system_default` and that `GET /store/payment-providers?region_id=...` returns it.
3. Check `STORE_CORS` and that the storefront origin is allowed (calls are server to server, so this is mostly for later).

## 2. Server routes (Nuxt)

All under `server/api/checkout/`, all `Cache-Control: no-store`, all reading the cart ID from the cookie.

1. `GET /api/checkout` - returns cart summary plus the chosen address, email, shipping method and payment state, so the page can resume after a reload.
2. `PUT /api/checkout/details` - `{ email, firstName, lastName, phone }`. Updates the cart (`sdk.store.cart.update`) with the email and a shipping and billing address built from the customer's name and phone plus the configured pickup address (country `lt`). Medusa needs an address with a country to match the pickup option's service zone; the customer is not asked for an address.
3. `GET /api/checkout/shipping-options` - lists options for the cart (`sdk.store.fulfillment.listCartOptions`), mapped to `{ id, name, description, amount }`. With one option the page selects it automatically.
4. `POST /api/checkout/shipping` - `{ optionId }`. Adds the shipping method to the cart (`sdk.store.cart.addShippingMethod`) and returns the updated totals.
5. `POST /api/checkout/payment` - creates the payment collection and a session for the chosen provider (`sdk.store.payment.initiatePaymentSession`).
6. `POST /api/checkout/complete` - calls `sdk.store.cart.complete`. On success: clears the cart cookie, sets a short-lived order cookie, and returns `{ orderId }`. If Medusa returns a cart error (for example a missing shipping method or a price change), return a clear Lithuanian message and keep the cart.
7. `GET /api/orders/[id]` - returns the confirmation data only if the order ID matches the order cookie.
8. Validation (new `shared/checkout.ts`): email format and length, first and last name (1 to 80 characters), phone (required, E.164-ish, so the farm can reach the customer about pickup), and `optionId` format. Reject anything else with 400. There is no address validation because there is no customer address.
9. Extend `mapCart` (or add `mapCheckout`) with shipping total, tax total, and grand total, so the summary shows subtotal, delivery and total.

## 3. Client

1. `app/composables/useCheckout.ts` - state for the form and step status, and calls for the routes above.
2. Page `app/pages/apmokejimas.vue`:
   - Redirect to the home page (or show an empty-cart message) if the cart is empty.
   - Sections: Contacts (email, first name, last name, phone), Pickup (the single option, selected by default, with the pickup address and opening hours from config), Payment (one line: no payment is taken now, pay at pickup), and Order summary (items, total, which already includes VAT) beside it on desktop and above it on mobile.
   - "Pateikti užsakymą" button, disabled while a request runs, with a pending state and an inline error area (`role="alert"`).
   - Two-column layout on desktop, single column on mobile, Tailwind only, Lithuanian copy.
3. Enable the "Apmokėjimas" button in `CartDrawer.vue` and link it to `/apmokejimas`.
4. Page `app/pages/uzsakymas/[id].vue`: thank-you message, order number, items, total, the pickup address, a note that no payment has been taken, and a link back to the catalog.
5. Accessibility: labels and `autocomplete` attributes on every field, error messages tied to fields with `aria-describedby`, focus moved to the first invalid field on submit, and the page title updated per page.

## 4. Edge cases

- Cart changes after the shipping method was added (quantity changed in the dialog): the shipping method and payment session may need refreshing. Re-run those steps and show the new total before completing.
- Price or availability changed since the item was added: show Medusa's error and let the customer return to the cart.
- Double submit: disable the button and make `complete` safe to call twice (a second call for an already completed cart returns the same order or a clear message).
- Expired or missing cart cookie: redirect to the catalog with a message.
- Medusa unavailable: reuse `upstreamError` and show the retry message.

## 5. Testing

- Unit tests (`tests/checkout.test.mjs`): the validators (good and bad emails, postal codes, option IDs, oversize strings) and the mapping of totals.
- Smoke test (`tests/smoke.mjs`, with the backend running): add an item, set details, list and choose shipping, create the payment session, complete, and check that the cart cookie is cleared and the order is returned.
- Manual: a valid order completes end to end; invalid email or phone is rejected; empty cart redirects; reload on each step keeps the data; keyboard-only completion; mobile layout; Medusa stopped mid-checkout.

## 6. Order of work

1. Backend `setup-checkout.ts` and verification that Lithuanian shipping options appear (this unblocks everything else).
2. `shared/checkout.ts` validators and tests.
3. Server routes, in the order: details, shipping options, shipping, payment, complete, order.
4. `useCheckout` and the checkout page.
5. Confirmation page and enabling the drawer button.
6. Smoke test and manual pass.

## Later (not in this plan)

- Real payments: add `@medusajs/payment-stripe` to `medusa-config.ts` with keys in environment variables, enable it for the region, use Stripe Elements on the checkout page, and handle the webhook for confirmed payments.
- Courier delivery (a new service zone, options and prices, and an address form), a VAT breakdown on invoices (tax-inclusive price preference plus Lithuanian tax rates), order emails (notification module), guest order lookup, customer accounts, discount codes, and stock tracking (turn on `manage_inventory` and reservations).

## Open questions

- What is the pickup address and what are the pickup hours or days?
- Should the customer choose a pickup date or time, or is "we will contact you" enough?
- Does the farm get notified of new orders (email, admin only)? Medusa's admin shows orders, but there is no email by default.
