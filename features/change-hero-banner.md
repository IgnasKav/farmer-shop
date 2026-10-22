# Change hero banner to a featured product with instant buy

## Goal

Replace the promotional hero on the home page (`/`) with a **featured product**
banner: product picture on the left, and on the right the product title, a
short description, price, and an **add-to-cart button** that works instantly
(without navigating to the product page). The featured product must be a real
product from the shop's catalog.

## Current state

- Hero lives in `farmer-commerce/apps/storefront/app/pages/index.vue`
  (`<section aria-labelledby="hero-heading">`):
  - Left column: promo heading "Geras maistas. *Arčiau jūsų.*", paragraph,
    and an `<a href="#katalogas">` CTA.
  - Right column: hardcoded image (`heroImage` constant pointing at an
    external URL) with a rotated leaf badge and "SEZONO ATRADIMAI" caption.
- The store already exposes everything needed:
  - `GET /api/products/[handle]` (`server/api/products/[handle].get.ts`)
    returns a mapped `Product` (`shared/types.ts`): `title`, `description`,
    `thumbnail`, `images`, `variants[{ id, title, amount, available }]`,
    `amount`, `unit`, `available`. Throws 404 for unknown handles.
  - `useCart().add(variantId, quantity)` (`app/composables/useCart.ts`) posts
    to `/api/cart/items` and manages `pending` / `error` state.
  - The product page (`pages/produktai/[handle].vue`) already implements the
    exact add-to-cart interaction to mirror: `canBuy` check, `justAdded`
    feedback, and opening the cart drawer on success (`cartOpen.value = true`).

## Design

Desktop (≥ 681 px), two columns (reversed vs. today — image **left**):

```
┌───────────────────────────┬──────────────────────────────┐
│                           │  SAVAITĖS PASIŪLYMAS         │
│      product image        │  Product title (h1)          │
│   (rounded, asymmetric    │  Short description (≤3 lines)│
│    corners, leaf badge)   │  3,49 € / vnt.               │
│                           │  [Į krepšelį 🛒]  [Plačiau →]│
└───────────────────────────┴──────────────────────────────┘
```

- **Image (left):** `ProductImage` with `eager`, product's first image or
  `thumbnail` as fallback, alt = product title. Keep the existing visual
  treatment: `rounded-[6px_60px_6px_6px]` container, subtle gradient overlay,
  rotated leaf badge. Use `object-contain` on a neutral background
  (product photos are square with whitespace) instead of the current
  cover/brightness crop used for the mood photo.
- **Content (right):**
  - Eyebrow label: `SAVAITĖS PASIŪLYMAS` (tracking-wide, small caps style
    like the current "SEZONO ATRADIMAI" caption).
  - `h1#hero-heading`: product title, linking to `/produktai/{handle}`.
    Keep the existing clamp-based display sizing but reduce to
    `text-[clamp(32px,3.4vw,48px)]` so real product names fit.
  - Description: `product.description` with `line-clamp-3` (descriptions in
    the seed data are very long — never render them in full).
  - Price: `money()`-formatted amount + `unit` (reuse the
    `Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" })`
    helper pattern from the product page).
  - Primary button `Į krepšelį` with `ShoppingCartIcon` (lucide, project
    standard), reusing the `primaryButton` class string; secondary link
    `Plačiau` → product page.
- Mobile (`max-[680px]`): single column, image first (on top), then content;
  button full-width.

## Data flow

1. **Configurable handle.** Add `featuredProductHandle` to
   `runtimeConfig.public` in `nuxt.config.ts` (default: a real seeded handle,
   e.g. `"morkos-nerac-su-zememis"` — pick one that exists in
   `apps/backend/src/scripts/data/pilnas-puodas.json` and has an image).
   Overridable via `NUXT_PUBLIC_FEATURED_PRODUCT_HANDLE`.
2. **Fetch on the home page.** In `index.vue`, next to the existing catalog
   `useFetch`, add:
   ```ts
   const { data: featured } = await useFetch<Product>(
     () => `/api/products/${config.public.featuredProductHandle}`,
   );
   ```
   Use the non-throwing variant (`useFetch` returns `error` instead of
   throwing for client-side rendering) — do **not** call `createError`.
3. **Fallback.** If the fetch fails or returns nothing (misconfigured handle,
   product deleted), render the **current promotional hero** unchanged. Wrap
   the new markup in `v-if="featured"` / `v-else` so the home page can never
   break because of the featured product.

## Add-to-cart interaction

Mirror the product page logic, simplified to the first variant:

```ts
const { add, pending, isOpen: cartOpen } = useCart();
const featuredVariant = computed(() => featured.value?.variants[0]);
const canBuy = computed(
  () => !!featuredVariant.value?.available && featuredVariant.value.amount != null,
);
const justAdded = ref(false);
async function addToCart() {
  if (!featuredVariant.value || !canBuy.value) return;
  justAdded.value = await add(featuredVariant.value.id, 1);
  if (justAdded.value) cartOpen.value = true;
}
```

- Button disabled while `pending` or `!canBuy`; show "Įdėta į krepšelį."
  confirmation text after success (same as product page).
- `aria-label` on the button includes the product title, e.g.
  `Į krepšelį: {title}`.

## Implementation steps

1. `nuxt.config.ts`: add `featuredProductHandle` to `runtimeConfig.public`.
2. Verify the default handle exists in the seed data and has a good image;
   adjust the default accordingly.
3. `pages/index.vue`:
   - Add the `useFetch` for the featured product + cart wiring (above).
   - Replace the hero `<section>` content: new featured layout with
     `v-if="featured"`, existing promo hero moved under `v-else`.
   - Remove the hardcoded `heroImage` constant (it becomes the fallback
     hero's image — keep it inside the `v-else` branch).
   - Add `ShoppingCartIcon` (and keep `LeafIcon`) to the lucide imports.
4. Keep all existing i18n style (Lithuanian strings), Tailwind design tokens
   (`green`, `muted`, `line`, `paper`), and breakpoint conventions
   (`max-[1000px]`, `max-[680px]`).

## Accessibility

- Section keeps `aria-labelledby="hero-heading"`; the featured product title
  carries `id="hero-heading"` in the new branch.
- Image `alt` = product title (meaningful, since the image is the product).
- Price rendered as text (not only inside the button).

## Verification

- `npm run typecheck --workspace @dtc/storefront` passes.
- `npm run test --workspace @dtc/storefront` passes (catalog tests unaffected;
  no API changes).
- Manual smoke (`npm run storefront:dev`):
  1. Home page shows featured product with image, title, ≤3-line description,
     price, and working `Į krepšelį` button; cart drawer opens on success.
  2. Mobile viewport: image stacks above content, button full-width.
  3. Set `NUXT_PUBLIC_FEATURED_PRODUCT_HANDLE` to a bogus handle → promo hero
     fallback renders, no console errors.
  4. `Plačiau` link navigates to the correct product page.
