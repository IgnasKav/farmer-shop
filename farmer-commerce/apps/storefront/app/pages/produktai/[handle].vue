<script setup lang="ts">
import type { Product } from "../../../shared/types";
const route = useRoute();
const { data: product, error } = await useFetch<Product>(
  () => `/api/products/${encodeURIComponent(String(route.params.handle))}`,
);
if (error.value)
  throw createError({
    statusCode: error.value.statusCode || 502,
    statusMessage:
      error.value.statusCode === 404
        ? "Produktas nerastas"
        : "Nepavyko atverti produkto",
  });
const selected = ref(0);
const imageIndex = ref(0);
const variant = computed(() => product.value?.variants[selected.value]);
const images = computed(() =>
  product.value?.images.length
    ? product.value.images
    : [product.value?.thumbnail || ""],
);
const money = (amount: number) =>
  new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(
    amount,
  );
useSeoMeta({
  title: () => `${product.value?.title || "Produktas"} — Ūkio krautuvė`,
  description: () => product.value?.description.slice(0, 160),
});
</script>
<template>
  <main
    id="main"
    class="mx-auto max-w-[1360px] px-12 pb-20 pt-6 max-[1000px]:px-7 max-[680px]:px-5 max-[680px]:pt-1"
    v-if="product"
  >
    <nav
      class="mb-9 mt-2 flex gap-3 text-[11px] leading-relaxed text-muted [&>a]:whitespace-nowrap [&>a]:underline max-[680px]:mb-5"
      aria-label="Kelias"
    >
      <NuxtLink to="/#katalogas">Visi produktai</NuxtLink><span>/</span
      ><span>{{ product.title }}</span>
    </nav>
    <div
      class="grid grid-cols-2 gap-16 max-[1000px]:gap-9 max-[680px]:grid-cols-1 max-[680px]:gap-4"
    >
      <div>
        <div
          class="aspect-square overflow-hidden rounded-lg bg-[#eeeee6] [&_img]:h-full [&_img]:w-full [&_img]:object-contain"
        >
          <ProductImage :src="images[imageIndex]" :alt="product.title" eager />
        </div>
        <div
          v-if="images.length > 1"
          class="mt-4 flex flex-wrap gap-3 [&_button]:size-[74px] [&_button]:overflow-hidden [&_button]:rounded [&_button]:border [&_button]:border-line [&_button]:bg-transparent [&_button]:p-[3px] [&_button[aria-pressed=true]]:border-green [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
        >
          <button
            v-for="(image, index) in images"
            :key="image"
            :aria-label="`Peržiūrėti ${index + 1} nuotrauką`"
            :aria-pressed="imageIndex === index"
            @click="imageIndex = index"
          >
            <ProductImage :src="image" :alt="product.title" />
          </button>
        </div>
      </div>
      <div class="pt-5 max-[680px]:pt-2.5">
        <h1
          class="text-4xl font-semibold leading-tight tracking-[-1.2px] max-[1000px]:text-[28px] max-[680px]:text-[29px]"
        >
          {{ product.title }}
        </h1>
        <div
          class="flex flex-wrap gap-2 [&>a]:rounded-full [&>a]:bg-[#edf0e5] [&>a]:px-2.5 [&>a]:py-1.5 [&>a]:text-[11px]"
        >
          <NuxtLink
            v-for="category in product.categories"
            :key="category"
            :to="{ path: '/', query: { category }, hash: '#katalogas' }"
            >{{ category }}</NuxtLink
          >
        </div>
        <p
          class="my-7 text-[32px] font-semibold max-[680px]:text-[29px] [&>span]:ml-2.5 [&>span]:text-[13px] [&>span]:font-normal [&>span]:text-muted"
        >
          {{
            variant?.amount != null
              ? money(variant.amount)
              : "Kaina nenurodyta"
          }}<span>/ {{ variant?.title || product.unit }}</span>
        </p>
        <label
          v-if="product.variants.length > 1"
          class="my-5 flex flex-col gap-2 text-xs [&>select]:rounded [&>select]:border [&>select]:border-line [&>select]:bg-white [&>select]:p-3"
          >Pasirinkite dydį<select v-model="selected">
            <option
              v-for="(v, index) in product.variants"
              :key="v.id"
              :value="index"
            >
              {{ v.title }}
            </option>
          </select></label
        >
        <p
          class="flex items-center gap-2 text-xs text-[#536b42] [&>span]:size-1.5 [&>span]:rounded-full [&>span]:bg-[#738f57]"
          :class="{
            '!text-[#96705b] [&>span]:!bg-[#b79475]': !variant?.available,
          }"
        >
          <span />{{ variant?.available ? "Yra kataloge" : "Šiuo metu nėra" }}
        </p>
        <div
          class="mt-6 border-t border-line pt-6 [&>h2]:mb-4 [&>h2]:text-[19px] [&>p]:whitespace-pre-line [&>p]:text-sm [&>p]:leading-relaxed [&>p]:text-[#68715f]"
        >
          <h2>Apie produktą</h2>
          <p>
            {{
              product.description ||
              "Daugiau informacijos apie šį produktą netrukus."
            }}
          </p>
        </div>
        <NuxtLink class="mt-5 inline-block text-xs underline" to="/#katalogas"
          >← Toliau atrasti gėrybes</NuxtLink
        >
      </div>
    </div>
  </main>
</template>
