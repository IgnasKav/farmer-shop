<script setup lang="ts">
import type { Product } from "../../shared/types"
defineProps<{ product: Product }>()
const money = (amount: number) =>
  new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(
    amount
  )
</script>
<template>
  <article class="product-card">
    <NuxtLink :to="`/produktai/${product.handle}`" class="product-link">
      <div class="product-image">
        <ProductImage :src="product.thumbnail" :alt="product.title" /><span
          v-if="!product.available"
          class="stock-badge"
          >Šiuo metu nėra</span
        ><span class="card-arrow"><AppIcon name="arrow" /></span>
      </div>
      <div class="product-info">
        <p class="product-category">
          {{ product.categories[0] || "Krautuvės gėrybės" }}
        </p>
        <h3>{{ product.title }}</h3>
        <p class="product-unit">{{ product.unit }}</p>
        <div class="product-bottom">
          <strong>{{
            product.amount === null ? "Kaina nenurodyta" : money(product.amount)
          }}</strong
          ><span>Peržiūrėti <span aria-hidden="true">↗</span></span>
        </div>
      </div>
    </NuxtLink>
  </article>
</template>
