<script setup lang="ts">
import type { Order } from "../../../shared/types";
const route = useRoute();
const { data: order, error } = await useFetch<Order>(
  () => `/api/orders/${encodeURIComponent(String(route.params.id))}`,
);
if (error.value)
  throw createError({
    statusCode: error.value.statusCode || 502,
    statusMessage:
      error.value.statusCode === 404
        ? "Užsakymas nerastas"
        : "Nepavyko atverti užsakymo",
  });
const pickup = useRuntimeConfig().public.pickup;
const money = (amount: number) =>
  new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(
    amount,
  );
useSeoMeta({ title: "Užsakymas pateiktas — Ūkio krautuvė", robots: "noindex" });
</script>
<template>
  <main
    v-if="order"
    id="main"
    class="mx-auto max-w-[760px] px-5 pb-20 pt-10 max-[680px]:pt-4"
  >
    <div class="rounded-2xl border border-line bg-white p-8 max-[680px]:p-5">
      <AppIcon class="text-green" name="check" :size="36" />
      <h1
        class="mt-3 text-[32px] font-semibold tracking-[-1.2px] max-[680px]:text-[26px]"
      >
        Ačiū, užsakymas pateiktas!
      </h1>
      <p class="mt-2 text-sm text-muted">
        Užsakymo Nr. <strong>{{ order.displayId ?? order.id }}</strong
        >. Susisieksime el. paštu {{ order.email }} arba telefonu.
      </p>

      <ul class="mt-6 divide-y divide-line border-y border-line">
        <li
          v-for="item in order.items"
          :key="item.id"
          class="flex items-center gap-3 py-3"
        >
          <div
            class="size-14 shrink-0 overflow-hidden rounded-md bg-[#eeeee7] [&>div]:min-h-0 [&>img]:size-full [&>img]:object-cover"
          >
            <ProductImage :src="item.thumbnail" :alt="item.title" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="line-clamp-2 text-sm font-semibold">{{ item.title }}</p>
            <p class="text-xs text-muted">
              {{ item.variantTitle }} × {{ item.quantity }}
            </p>
          </div>
          <span class="text-sm font-semibold">{{ money(item.total) }}</span>
        </li>
      </ul>
      <p class="mt-4 flex justify-between text-base font-semibold">
        <span>Iš viso</span><span>{{ money(order.total) }}</span>
      </p>

      <div class="mt-6 rounded-[5px] bg-[#edf0e5] p-4 text-sm text-[#4d5a43]">
        <p class="font-semibold">{{ pickup.name }}</p>
        <p v-if="pickup.address" class="mt-1">
          {{ pickup.address
          }}<template v-if="pickup.city">, {{ pickup.city }}</template>
        </p>
        <p v-if="pickup.hours" class="mt-1">{{ pickup.hours }}</p>
        <p class="mt-2">
          Mokėjimas dar nepaimtas — atsiskaitysite atsiimdami.
        </p>
      </div>

      <NuxtLink
        class="mt-6 inline-flex min-h-11 items-center rounded-[5px] bg-green px-[21px] text-xs font-semibold text-white hover:bg-[#29442d]"
        to="/#katalogas"
        >Grįžti į katalogą</NuxtLink
      >
    </div>
  </main>
</template>
