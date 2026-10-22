<script setup lang="ts">
const config = useRuntimeConfig();
</script>
<template>
  <div>
    <a href="#main" class="skip-link">Pereiti prie turinio</a>
    <header class="header wrap">
      <NuxtLink to="/" class="brand" aria-label="Į pagrindinį puslapį"
        ><span class="brand-mark"><AppIcon name="leaf" :size="29" /></span
        ><span
          >{{ config.public.storeName
          }}<small>GERAS MAISTAS ARČIAU</small></span
        ></NuxtLink
      >
      <nav aria-label="Pagrindinė navigacija">
        <NuxtLink to="/#katalogas">Produktai</NuxtLink>
      </nav>
    </header>
    <NuxtLoadingIndicator color="#45633c" />
    <NuxtPage />
  </div>
</template>
