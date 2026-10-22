<script setup lang="ts">
import type { Product } from "../../shared/types";
import { ArrowRightIcon } from "@lucide/vue";

defineProps<{ product: Product }>();
const money = (amount: number) =>
  new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(
    amount,
  );
</script>
<template>
  <article class="min-w-0">
    <NuxtLink
      :to="`/produktai/${product.handle}`"
      class="group flex h-full flex-col rounded-[26px] bg-white p-2.5 shadow-[0_1px_2px_rgba(38,55,43,0.04),0_8px_24px_-12px_rgba(38,55,43,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(38,55,43,0.05),0_22px_40px_-16px_rgba(38,55,43,0.22)] max-[680px]:rounded-[20px] max-[680px]:p-2"
    >
      <div
        class="relative aspect-square overflow-hidden rounded-[18px] bg-[#eeeee7] max-[680px]:rounded-2xl [&>img]:absolute [&>img]:size-full [&>img]:object-cover [&>img]:transition-transform [&>img]:duration-500 group-hover:[&>img]:scale-105"
      >
        <ProductImage :src="product.thumbnail" :alt="product.title" />
        <span
          v-if="!product.available"
          class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium backdrop-blur"
          >Šiuo metu nėra</span
        >
        <span
          v-else-if="product.categories[0]"
          class="absolute left-3 top-3 max-w-[calc(100%-24px)] truncate rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-[#4d5a43] backdrop-blur max-[680px]:left-2 max-[680px]:top-2"
          >{{ product.categories[0] }}</span
        >
      </div>
      <div class="flex flex-1 flex-col px-2 pb-1.5 pt-4 max-[680px]:px-1">
        <h3
          class="mb-1 line-clamp-2 min-h-[40px] text-[14px] font-[650] leading-[1.4] max-[680px]:min-h-[34px] max-[680px]:text-[12px]"
        >
          {{ product.title }}
        </h3>
        <p class="text-[11px] text-muted">{{ product.unit }}</p>
        <div class="mt-4 flex items-center justify-between gap-2">
          <strong
            class="text-[19px] font-semibold tracking-tight max-[680px]:text-[15px]"
            >{{
              product.amount === null
                ? "Kaina nenurodyta"
                : money(product.amount)
            }}</strong
          >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-full bg-green text-white transition duration-300 group-hover:bg-[#29442d] group-hover:[&>svg]:translate-x-0.5 max-[680px]:size-8 [&>svg]:transition-transform"
            aria-hidden="true"
            ><ArrowRightIcon :size="18" :stroke-width="1.6"
          /></span>
        </div>
      </div>
    </NuxtLink>
  </article>
</template>