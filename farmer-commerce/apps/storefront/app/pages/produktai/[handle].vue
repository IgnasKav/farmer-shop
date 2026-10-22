<script setup lang="ts">
import type { Product } from "../../../shared/types"
const route = useRoute()
const { data: product, error } = await useFetch<Product>(
  () => `/api/products/${encodeURIComponent(String(route.params.handle))}`
)
if (error.value)
  throw createError({
    statusCode: error.value.statusCode || 502,
    statusMessage:
      error.value.statusCode === 404
        ? "Produktas nerastas"
        : "Nepavyko atverti produkto"
  })
const selected = ref(0)
const imageIndex = ref(0)
const variant = computed(() => product.value?.variants[selected.value])
const images = computed(() =>
  product.value?.images.length
    ? product.value.images
    : [product.value?.thumbnail || ""]
)
const money = (amount: number) =>
  new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(
    amount
  )
useSeoMeta({
  title: () => `${product.value?.title || "Produktas"} — Ūkio krautuvė`,
  description: () => product.value?.description.slice(0, 160)
})
</script>
<template>
  <main id="main" class="wrap detail" v-if="product">
    <nav class="breadcrumbs" aria-label="Kelias">
      <NuxtLink to="/#katalogas">Visi produktai</NuxtLink><span>/</span
      ><span>{{ product.title }}</span>
    </nav>
    <div class="detail-grid">
      <div>
        <div class="detail-image">
          <ProductImage :src="images[imageIndex]" :alt="product.title" eager />
        </div>
        <div v-if="images.length > 1" class="image-thumbnails">
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
      <div class="detail-copy">
        <p class="eyebrow">KRAUTUVĖS GĖRYBĖS</p>
        <h1>{{ product.title }}</h1>
        <div class="detail-categories">
          <NuxtLink
            v-for="category in product.categories"
            :key="category"
            :to="{ path: '/', query: { category }, hash: '#katalogas' }"
            >{{ category }}</NuxtLink
          >
        </div>
        <p class="detail-price">
          {{
            variant?.amount != null
              ? money(variant.amount)
              : "Kaina nenurodyta"
          }}<span>/ {{ variant?.title || product.unit }}</span>
        </p>
        <label v-if="product.variants.length > 1" class="variant-label"
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
        <p class="availability" :class="{ unavailable: !variant?.available }">
          <span />{{ variant?.available ? "Yra kataloge" : "Šiuo metu nėra" }}
        </p>
        <div class="purchase-note">
          <AppIcon name="leaf" :size="24" />
          <p>
            Kol kas kviečiame pasižvalgyti.<br /><strong
              >Užsakymai šioje parduotuvėje dar nepriimami.</strong
            >
          </p>
        </div>
        <div class="description">
          <h2>Apie produktą</h2>
          <p>
            {{
              product.description ||
              "Daugiau informacijos apie šį produktą netrukus."
            }}
          </p>
        </div>
        <NuxtLink class="back-link" to="/#katalogas"
          >← Toliau atrasti gėrybes</NuxtLink
        >
      </div>
    </div>
  </main>
</template>
