<script setup lang="ts">
defineProps<{ error: { statusCode?: number; statusMessage?: string } }>()
</script>
<template>
  <main class="error-page">
    <span class="eyebrow">ŪKIO KRAUTUVĖ</span>
    <h1>
      {{
        error.statusCode === 404
          ? "Šios gėrybės neradome."
          : "Trumpa pertraukėlė."
      }}
    </h1>
    <p>
      {{
        error.statusCode === 404
          ? "Produktas arba puslapis neegzistuoja. Kataloge laukia daugiau atradimų."
          : "Nepavyko atverti parduotuvės. Pabandykite dar kartą."
      }}
    </p>
    <button class="button primary" @click="clearError({ redirect: '/' })">
      Grįžti į katalogą →
    </button>
  </main>
</template>
