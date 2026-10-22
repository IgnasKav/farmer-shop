# Plan: checkout for the storefront

Builds on `add-to-cart-functinality.md`. The cart dialog currently ends with a disabled "Apmokėjimas — netrukus" button. This plan makes it work and lets customers place an order.

## Scope

- Guest checkout only (no customer accounts).
- One page, `/apmokejimas`, with contact, shipping address, delivery method, payment, and an order summary.
- A confirmation page, `/uzsakymas/[id]`, after the order is placed.
- Payment starts with Medusa's built-in `pp_system_default` provider (no money is taken). Real payments (Stripe) are a separate later step.
- Out of scope: accounts, discount codes, returns, order history, emails beyond the default, multiple regions or currencies.

## Current state (what exists, what is missing)

- Storefront: cart routes under `server/api/cart/*`, the `HttpOnly` `cart_id` cookie, `useCart`, and `CartDrawer.vue`. Prices are in EUR for the Lithuanian region (`medusaRegionId`).
- Region: `setup-storefront.ts` creates "Lietuva (demonstracinė)", EUR, country `lt`, with the `pp_system_default` payment provider and `automatic_taxes: false`.
- **Gap: delivery.** The shipping options in `initial-data-seed.ts` belong to a service zone for gb, de, dk, se, fr, es and it. **Lithuania is not covered**, so no shipping option can be selected for a Lithuanian address.
- **Gap: tax.** The seed creates tax regions for the countries above, not for `lt`. With `automatic_taxes: false` this is not blocking, but it should be decided on purpose.
- Stock: seeded variants use `manage_inventory: false`, so completing a cart does not need stock reservations.

## Design decisions

- Same pattern as the cart: the browser calls Nuxt server routes and the Medusa key and cart ID stay server-side.
- The cart ID cookie stays `HttpOnly`. After the order is placed the cookie is cleared.
- The order confirmation is shown from data returned by the complete call and a short-lived signed cookie (or the order ID plus the order's own email check). The order ID alone must not expose personal data to anyone who guesses a URL.
- Each step is validated on the server (not only in the form) with the same hand-written validators in `shared/` that the cart uses, so they can be unit tested.

## 1. Backend (Medusa) setup

1. Add a script `src/scripts/setup-checkout.ts` (idempotent, same style as `setup-storefront.ts`) that:
   - creates a fulfillment set and a service zone with `lt` as the geo zone, linked to the existing stock location;
   - creates shipping options for that zone with the `manual_manual` provider and the default shipping profile, with EUR prices. Suggested: "Kurjeris" (courier, flat price) and "Atsiėmimas ūkyje" (pickup, free). Confirm real prices and options with the shop;
   - makes sure the sales channel is linked to the stock location;
   - adds a tax region for `lt` if taxes are wanted (decide: prices include VAT or not; Lithuanian VAT is 21%, and food rates differ).
2. Confirm the region has `pp_system_default` and that `GET /store/payment-providers?region_id=...` returns it.
3. Check `STORE_CORS` and that the storefront origin is allowed (calls are server to server, so this is mostly for later).

## 2. Server routes (Nuxt)

All under `server/api/checkout/`, all `Cache-Control: no-store`, all reading the cart ID from the cookie.

1. `GET /api/checkout` - returns cart summary plus the chosen address, email, shipping method and payment state, so the page can resume after a reload.
2. `PUT /api/checkout/details` - `{ email, shippingAddress }`. Updates the cart (`sdk.store.cart.update`) with email and shipping and billing address (billing the same as shipping in v1). Country is fixed to `lt`.
3. `GET /api/checkout/shipping-options` - lists options for the cart (`sdk.store.fulfillment.listCartOptions`), mapped to `{ id, name, description, amount }`.
4. `POST /api/checkout/shipping` - `{ optionId }`. Adds the shipping method to the cart (`sdk.store.cart.addShippingMethod`) and returns the updated totals.
5. `POST /api/checkout/payment` - creates the payment collection and a session for the chosen provider (`sdk.store.payment.initiatePaymentSession`).
6. `POST /api/checkout/complete` - calls `sdk.store.cart.complete`. On success: clears the cart cookie, sets a short-lived order cookie, and returns `{ orderId }`. If Medusa returns a cart error (for example a missing shipping method or a price change), return a clear Lithuanian message and keep the cart.
7. `GET /api/orders/[id]` - returns the confirmation data only if the order ID matches the order cookie.
8. Validation (new `shared/checkout.ts`): email format and length, name (1 to 80 characters), address lines, city, postal code (Lithuanian format `LT-12345` or `12345`), phone (optional, E.164-ish), and `optionId` format. Reject anything else with 400.
9. Extend `mapCart` (or add `mapCheckout`) with shipping total, tax total, and grand total, so the summary shows subtotal, delivery and total.

## 3. Client

1. `app/composables/useCheckout.ts` - state for the form and step status, and calls for the routes above.
2. Page `app/pages/apmokejimas.vue`:
   - Redirect to the home page (or show an empty-cart message) if the cart is empty.
   - Sections: Contacts (email, phone), Delivery address (first name, last name, address, city, postal code, country fixed to Lithuania), Delivery method (radio list from the shipping options), Payment (radio list from the providers; with only the system provider this can be one line of text), and Order summary (items, subtotal, delivery, total) beside it on desktop and above it on mobile.
   - "Pateikti užsakymą" button, disabled while a request runs, with a pending state and an inline error area (`role="alert"`).
   - Two-column layout on desktop, single column on mobile, Tailwind only, Lithuanian copy.
3. Enable the "Apmokėjimas" button in `CartDrawer.vue` and link it to `/apmokejimas`.
4. Page `app/pages/uzsakymas/[id].vue`: thank-you message, order number, items, address, delivery method, total, and a link back to the catalog.
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
- Manual: Lithuanian address works end to end; a non-Lithuanian country is rejected; empty cart redirects; reload on each step keeps the data; keyboard-only completion; mobile layout; Medusa stopped mid-checkout.

## 6. Order of work

1. Backend `setup-checkout.ts` and verification that Lithuanian shipping options appear (this unblocks everything else).
2. `shared/checkout.ts` validators and tests.
3. Server routes, in the order: details, shipping options, shipping, payment, complete, order.
4. `useCheckout` and the checkout page.
5. Confirmation page and enabling the drawer button.
6. Smoke test and manual pass.

## Later (not in this plan)

- Real payments: add `@medusajs/payment-stripe` to `medusa-config.ts` with keys in environment variables, enable it for the region, use Stripe Elements on the checkout page, and handle the webhook for confirmed payments.
- Order emails (notification module), guest order lookup, customer accounts, discount codes, and stock tracking (turn on `manage_inventory` and reservations).

## Open questions

- Which delivery options and prices does the shop offer (courier, parcel lockers, farm pickup)? Is delivery limited to certain cities?
- Do displayed prices already include VAT? Do we need a tax region for Lithuania now?
- Is the first version allowed to take orders without payment (system provider), or should it wait for Stripe?
- Which fields are required (phone, company, delivery notes)?
- Is a billing address different from the shipping address needed?