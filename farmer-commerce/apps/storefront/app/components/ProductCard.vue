<script setup lang="ts">
import type { Product } from "../../shared/types";
defineProps<{ product: Product }>();
const money = (amount: number) =>
  new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(
    amount,
  );
</script>
<template>
  <article class="min-w-0">
    <NuxtLink :to="`/produktai/${product.handle}`" class="group block h-full">
      <div
        class="relative aspect-[1.1] overflow-hidden rounded bg-[#eeeee7] max-[680px]:aspect-square [&>img]:absolute [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:transition-transform [&>img]:duration-300 group-hover:[&>img]:scale-105"
      >
        <ProductImage :src="product.thumbnail" :alt="product.title" /><span
          v-if="!product.available"
          class="absolute left-2.5 top-2.5 rounded-sm bg-white/80 px-2 py-1 text-[10px]"
          >Å iuo metu nÄ—ra</span
        ><span
          class="absolute bottom-2.5 right-2.5 grid size-[33px] place-items-center rounded-full bg-white/95 text-green opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-[680px]:hidden"
          ><AppIcon name="arrow"
        /></span>
      </div>
      <div class="px-px pt-3.5">
        <p
          class="mb-2 text-[8px] font-semibold uppercase tracking-[1.2px] text-[#838b77] max-[680px]:text-[7px]"
        >
          {{ product.categories[0] || "KrautuvÄ—s gÄ—rybÄ—s" }}
        </p>
        <h3
          class="mb-[7px] min-h-10 text-[13px] font-[650] leading-[1.55] max-[680px]:min-h-[54px] max-[680px]:text-xs max-[680px]:leading-normal"
        >
          {{ product.title }}
        </h3>
        <p class="mb-3 text-[10px] text-muted">{{ product.unit }}</p>
        <div
          class="flex items-center justify-between gap-1.5 border-t border-line pt-2.5 [&>strong]:text-base [&>strong]:font-semibold max-[680px]:[&>strong]:text-sm"
        >
          <strong>{{
            product.amount === null ? "Kaina nenurodyta" : money(product.amount)
          }}</strong>
        </div>
      </div>
    </NuxtLink>
  </article>
</template>
