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
        <NuxtLink to="/#katalogas">Produktai</NuxtLink
        ><a href="/#apie">Apie krautuvę</a>
      </nav>
      <span class="header-note"
        ><AppIcon name="sun" /> Skoniui ir kasdienai</span
      >
    </header>
    <NuxtLoadingIndicator color="#45633c" />
    <NuxtPage />
    <footer id="apie" class="footer">
      <div class="wrap footer-inner">
        <div>
          <p>Demonstracinė parduotuvė</p>
          <small
            >Užsakymai ir pristatymas dar neaktyvūs.<br />Produktų informacija:
            Pilnas Puodas.</small
          >
        </div>
        <a href="#main">Į viršų ↑</a>
      </div>
    </footer>
  </div>
</template>
