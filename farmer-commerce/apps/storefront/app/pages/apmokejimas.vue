<script setup lang="ts">
import {
  validateDetails,
  type CheckoutDetails,
  type DetailErrors,
} from "../../shared/checkout";
import type { CheckoutState } from "../../shared/types";

useSeoMeta({ title: "Apmokėjimas — Ūkio krautuvė" });
const pickup = useRuntimeConfig().public.pickup;
const { data, status } = useFetch<CheckoutState>("/api/checkout", {
  server: false,
  lazy: true,
  key: "checkout-state",
});
const { submitting, error, place } = useCheckout();

const form = reactive<CheckoutDetails>({
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
});
const errors = ref<DetailErrors>({});
watch(
  data,
  (state) => {
    if (!state) return;
    form.email ||= state.email;
    form.firstName ||= state.firstName;
    form.lastName ||= state.lastName;
    form.phone ||= state.phone;
  },
  { once: true },
);

const cart = computed(() => data.value?.cart);
const money = (amount: number) =>
  new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(
    amount,
  );

const field =
  "w-full rounded-[5px] border border-line bg-white px-3.5 py-3 text-sm aria-[invalid=true]:border-[#b4533a]";
const order: (keyof CheckoutDetails)[] = [
  "email",
  "firstName",
  "lastName",
  "phone",
];

async function submit() {
  const result = validateDetails(form);
  errors.value = result.errors;
  const first = order.find((key) => result.errors[key]);
  if (first) return document.getElementById(`field-${first}`)?.focus();
  const orderId = await place(result.values);
  if (orderId) await navigateTo(`/uzsakymas/${orderId}`);
}
</script>
<template>
  <main
    id="main"
    class="mx-auto max-w-[1360px] px-12 pb-20 pt-6 max-[1000px]:px-7 max-[680px]:px-5 max-[680px]:pt-1"
  >
    <nav
      class="mb-9 mt-2 flex gap-3 text-[11px] leading-relaxed text-muted [&>a]:underline max-[680px]:mb-5"
      aria-label="Kelias"
    >
      <NuxtLink to="/#katalogas">Visi produktai</NuxtLink><span>/</span
      ><span>Apmokėjimas</span>
    </nav>
    <h1
      class="mb-8 text-[32px] font-semibold tracking-[-1.2px] max-[680px]:text-[28px]"
    >
      Apmokėjimas
    </h1>

    <p v-if="status === 'pending' && !data" class="text-sm text-muted">
      Kraunama…
    </p>
    <div
      v-else-if="!cart?.items.length"
      class="rounded-md bg-[#f0f2e9] px-[25px] py-[60px] text-center"
    >
      <AppIcon class="mx-auto mb-5" name="cart" :size="36" />
      <h2 class="text-[23px] font-semibold">Krepšelis tuščias</h2>
      <p class="mb-5 mt-2 text-sm text-muted">
        Pridėkite produktų, kad galėtumėte pateikti užsakymą.
      </p>
      <NuxtLink
        class="inline-flex min-h-11 items-center rounded-[5px] bg-green px-[21px] text-xs font-semibold text-white hover:bg-[#29442d]"
        to="/#katalogas"
        >Grįžti į katalogą</NuxtLink
      >
    </div>

    <div
      v-else
      class="grid grid-cols-[1fr_400px] items-start gap-12 max-[1000px]:grid-cols-1 max-[1000px]:gap-8"
    >
      <form class="flex flex-col gap-8" novalidate @submit.prevent="submit">
        <section aria-labelledby="contacts-title">
          <h2 id="contacts-title" class="mb-4 text-lg font-semibold">
            Kontaktai
          </h2>
          <div class="grid grid-cols-2 gap-4 max-[680px]:grid-cols-1">
            <label
              class="col-span-2 flex flex-col gap-1.5 text-xs max-[680px]:col-span-1"
              >El. paštas
              <input
                id="field-email"
                v-model="form.email"
                :class="field"
                type="email"
                name="email"
                autocomplete="email"
                maxlength="254"
                required
                :aria-invalid="!!errors.email"
                :aria-describedby="errors.email ? 'error-email' : undefined"
              />
              <span
                v-if="errors.email"
                id="error-email"
                class="text-[#b4533a]"
                >{{ errors.email }}</span
              >
            </label>
            <label class="flex flex-col gap-1.5 text-xs"
              >Vardas
              <input
                id="field-firstName"
                v-model="form.firstName"
                :class="field"
                name="firstName"
                autocomplete="given-name"
                maxlength="80"
                required
                :aria-invalid="!!errors.firstName"
                :aria-describedby="
                  errors.firstName ? 'error-firstName' : undefined
                "
              />
              <span
                v-if="errors.firstName"
                id="error-firstName"
                class="text-[#b4533a]"
                >{{ errors.firstName }}</span
              >
            </label>
            <label class="flex flex-col gap-1.5 text-xs"
              >Pavardė
              <input
                id="field-lastName"
                v-model="form.lastName"
                :class="field"
                name="lastName"
                autocomplete="family-name"
                maxlength="80"
                required
                :aria-invalid="!!errors.lastName"
                :aria-describedby="
                  errors.lastName ? 'error-lastName' : undefined
                "
              />
              <span
                v-if="errors.lastName"
                id="error-lastName"
                class="text-[#b4533a]"
                >{{ errors.lastName }}</span
              >
            </label>
            <label
              class="col-span-2 flex flex-col gap-1.5 text-xs max-[680px]:col-span-1"
              >Telefonas
              <input
                id="field-phone"
                v-model="form.phone"
                :class="field"
                type="tel"
                name="phone"
                autocomplete="tel"
                maxlength="30"
                required
                :aria-invalid="!!errors.phone"
                :aria-describedby="errors.phone ? 'error-phone' : undefined"
              />
              <span
                v-if="errors.phone"
                id="error-phone"
                class="text-[#b4533a]"
                >{{ errors.phone }}</span
              >
            </label>
          </div>
        </section>

        <section aria-labelledby="pickup-title">
          <h2 id="pickup-title" class="mb-4 text-lg font-semibold">
            Atsiėmimas
          </h2>
          <div
            class="flex items-start gap-3 rounded-[5px] border border-green bg-white p-4 text-sm"
          >
            <AppIcon class="mt-0.5 text-green" name="leaf" :size="20" />
            <div>
              <p class="font-semibold">{{ pickup.name }} · nemokamai</p>
              <p v-if="pickup.address" class="mt-1 text-muted">
                {{ pickup.address
                }}<template v-if="pickup.city">, {{ pickup.city }}</template>
              </p>
              <p v-if="pickup.hours" class="mt-1 text-muted">
                {{ pickup.hours }}
              </p>
              <p v-if="!pickup.address" class="mt-1 text-muted">
                Atsiėmimo vietą ir laiką patikslinsime susisiekę.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="payment-title">
          <h2 id="payment-title" class="mb-4 text-lg font-semibold">
            Apmokėjimas
          </h2>
          <p class="rounded-[5px] bg-[#edf0e5] p-4 text-sm text-[#4d5a43]">
            Šiuo metu mokėjimas neimamas. Pateikę užsakymą, už jį atsiskaitysite
            atsiimdami.
          </p>
        </section>

        <div>
          <p
            v-if="error"
            class="mb-4 rounded bg-[#f6e9e2] px-4 py-3 text-sm text-[#96705b]"
            role="alert"
          >
            {{ error }}
          </p>
          <button
            type="submit"
            class="inline-flex min-h-12 w-full items-center justify-center rounded-[5px] bg-green px-6 text-sm font-semibold text-white hover:bg-[#29442d] disabled:cursor-not-allowed disabled:opacity-60 min-[1001px]:w-auto"
            :disabled="submitting"
          >
            {{ submitting ? "Pateikiama…" : "Pateikti užsakymą" }}
          </button>
        </div>
      </form>

      <aside
        class="rounded-2xl border border-line bg-white p-5 max-[1000px]:order-first"
        aria-labelledby="summary-title"
      >
        <h2 id="summary-title" class="mb-3 text-lg font-semibold">
          Jūsų užsakymas
        </h2>
        <ul class="divide-y divide-line">
          <li
            v-for="item in cart.items"
            :key="item.id"
            class="flex items-center gap-3 py-3"
          >
            <div
              class="size-14 shrink-0 overflow-hidden rounded-md bg-[#eeeee7] [&>div]:min-h-0 [&>img]:size-full [&>img]:object-cover"
            >
              <ProductImage :src="item.thumbnail" :alt="item.title" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="line-clamp-2 text-xs font-semibold leading-snug">
                {{ item.title }}
              </p>
              <p class="mt-0.5 text-[10px] text-muted">
                {{ item.variantTitle }} × {{ item.quantity }}
              </p>
            </div>
            <span class="text-sm font-semibold">{{ money(item.total) }}</span>
          </li>
        </ul>
        <dl class="mt-3 flex flex-col gap-2 border-t border-line pt-4 text-sm">
          <div class="flex justify-between">
            <dt>Atsiėmimas</dt>
            <dd>Nemokamai</dd>
          </div>
          <div class="flex justify-between text-base font-semibold">
            <dt>Iš viso</dt>
            <dd>{{ money(cart.total) }}</dd>
          </div>
          <p class="text-[11px] text-muted">Kainos nurodytos su PVM.</p>
        </dl>
      </aside>
    </div>
  </main>
</template>
