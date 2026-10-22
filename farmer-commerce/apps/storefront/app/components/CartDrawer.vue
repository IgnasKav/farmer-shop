<script setup lang="ts">
const { cart, pending, error, isOpen, refresh, setQuantity, remove } =
  useCart();
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
let openedBy: "hover" | "click" | null = null;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

const money = (amount: number) =>
  new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(
    amount,
  );

watch(isOpen, (open) => {
  if (open && !openedBy) openedBy = "click";
  if (!open) openedBy = null;
});

function close(returnFocus = false) {
  clearTimeout(closeTimer);
  isOpen.value = false;
  if (returnFocus) trigger.value?.focus();
}
function hoverIn(e: PointerEvent) {
  if (e.pointerType !== "mouse") return;
  clearTimeout(closeTimer);
  if (!isOpen.value) {
    openedBy = "hover";
    isOpen.value = true;
  }
}
function hoverOut(e: PointerEvent) {
  if (e.pointerType !== "mouse" || openedBy !== "hover") return;
  closeTimer = setTimeout(() => close(), 150);
}
function toggle() {
  if (isOpen.value && openedBy === "click") return close();
  openedBy = "click";
  isOpen.value = true;
}
function outside(e: Event) {
  if (isOpen.value && !root.value?.contains(e.target as Node)) close();
}
function focusOut(e: FocusEvent) {
  const next = e.relatedTarget as Node | null;
  if (next && !root.value?.contains(next)) close();
}

onMounted(() => {
  refresh();
  document.addEventListener("pointerdown", outside);
});
onBeforeUnmount(() => {
  clearTimeout(closeTimer);
  document.removeEventListener("pointerdown", outside);
});

const stepper =
  "grid size-7 place-items-center disabled:cursor-default disabled:opacity-40";
</script>
<template>
  <div
    ref="root"
    class="relative"
    @pointerenter="hoverIn"
    @pointerleave="hoverOut"
    @keydown.esc="close(true)"
    @focusout="focusOut"
  >
    <button
      ref="trigger"
      type="button"
      class="relative grid size-11 place-items-center rounded-full border border-[#ccd3c3] hover:bg-pale"
      aria-haspopup="dialog"
      aria-controls="cart-dialog"
      :aria-expanded="isOpen"
      :aria-label="`Krepšelis: ${cart.itemCount}`"
      @click="toggle"
    >
      <AppIcon name="cart" :size="22" />
      <span
        v-if="cart.itemCount > 0"
        class="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-green px-1 text-[10px] font-semibold text-white"
        aria-hidden="true"
        >{{ cart.itemCount }}</span
      >
    </button>
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 scale-95 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="translate-y-1 scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        id="cart-dialog"
        class="absolute right-0 top-full z-50 w-[380px] max-w-[calc(100vw-40px)] origin-top-right pt-3"
        role="dialog"
        aria-label="Krepšelis"
      >
        <div
          class="rounded-2xl border border-line bg-white p-5 shadow-[0_18px_50px_-12px_rgba(38,55,43,0.25)]"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Krepšelis</h2>
            <button
              type="button"
              class="grid size-8 place-items-center rounded-full hover:bg-pale"
              aria-label="Uždaryti krepšelį"
              @click="close(true)"
            >
              <AppIcon name="close" :size="18" />
            </button>
          </div>
          <p
            v-if="error"
            class="mt-3 rounded bg-[#f6e9e2] px-3 py-2 text-xs text-[#96705b]"
            role="alert"
          >
            {{ error }}
          </p>
          <p
            v-if="!cart.items.length"
            class="py-10 text-center text-sm text-muted"
          >
            Krepšelis tuščias.
          </p>
          <template v-else>
            <ul
              class="mt-3 max-h-[min(60vh,380px)] divide-y divide-line overflow-auto"
              :aria-busy="pending"
            >
              <li
                v-for="item in cart.items"
                :key="item.id"
                class="flex gap-3 py-3"
              >
                <NuxtLink
                  :to="`/produktai/${item.productHandle}`"
                  class="size-14 shrink-0 overflow-hidden rounded-md bg-[#eeeee7] [&>img]:size-full [&>img]:object-cover [&>div]:min-h-0"
                  tabindex="-1"
                  aria-hidden="true"
                  @click="close()"
                >
                  <ProductImage :src="item.thumbnail" :alt="item.title" />
                </NuxtLink>
                <div class="min-w-0 flex-1">
                  <NuxtLink
                    :to="`/produktai/${item.productHandle}`"
                    class="line-clamp-2 text-xs font-semibold leading-snug"
                    @click="close()"
                    >{{ item.title }}</NuxtLink
                  >
                  <p
                    v-if="item.variantTitle"
                    class="mt-0.5 text-[10px] text-muted"
                  >
                    {{ item.variantTitle }} · {{ money(item.unitPrice) }}
                  </p>
                  <div
                    class="mt-2 inline-flex items-center rounded border border-line text-xs"
                  >
                    <button
                      type="button"
                      :class="stepper"
                      :disabled="pending"
                      :aria-label="`Sumažinti kiekį: ${item.title}`"
                      @click="setQuantity(item.id, item.quantity - 1)"
                    >
                      <AppIcon name="minus" :size="14" />
                    </button>
                    <span class="min-w-6 text-center" aria-live="polite">{{
                      item.quantity
                    }}</span>
                    <button
                      type="button"
                      :class="stepper"
                      :disabled="pending || item.quantity >= 99"
                      :aria-label="`Padidinti kiekį: ${item.title}`"
                      @click="setQuantity(item.id, item.quantity + 1)"
                    >
                      <AppIcon name="plus" :size="14" />
                    </button>
                  </div>
                </div>
                <div class="flex flex-col items-end justify-between">
                  <span class="text-sm font-semibold">{{
                    money(item.total)
                  }}</span>
                  <button
                    type="button"
                    class="grid size-7 place-items-center rounded text-muted hover:bg-pale disabled:opacity-40"
                    :disabled="pending"
                    :aria-label="`Pašalinti: ${item.title}`"
                    @click="remove(item.id)"
                  >
                    <AppIcon name="trash" :size="16" />
                  </button>
                </div>
              </li>
            </ul>
            <div
              class="mt-3 flex items-center justify-between border-t border-line pt-4 text-sm"
            >
              <span>Tarpinė suma</span>
              <strong class="text-base font-semibold">{{
                money(cart.total)
              }}</strong>
            </div>
            <NuxtLink
              to="/apmokejimas"
              class="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-[5px] bg-green px-5 py-3 text-xs font-semibold text-white hover:bg-[#29442d]"
              @click="close()"
            >
              Apmokėjimas
            </NuxtLink>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>
