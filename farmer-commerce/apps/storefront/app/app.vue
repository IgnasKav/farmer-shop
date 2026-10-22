<script setup lang="ts">
import { LeafIcon } from "@lucide/vue";

const config = useRuntimeConfig();
</script>
<template>
  <div>
    <a
      href="#main"
      class="fixed left-2 top-[-100px] z-[100] bg-white p-4 focus:top-2"
      >Pereiti prie turinio</a
    >
    <header
      class="mx-auto flex h-[106px] max-w-[1360px] items-center justify-between gap-6 px-12 max-[1000px]:px-7 max-[680px]:h-[86px] max-[680px]:px-5"
    >
      <NuxtLink
        to="/"
        class="flex items-center gap-[11px] font-serif text-[27px] tracking-[-1px] max-[680px]:text-[23px]"
        aria-label="Į pagrindinį puslapį"
        ><span
          class="grid size-12 place-items-center rounded-full border border-[#ccd3c3] max-[680px]:size-[39px]"
          ><LeafIcon :size="29" :stroke-width="1.6" /></span
        ><span
          >{{ config.public.storeName
          }}<small
            class="mt-[5px] block font-sans text-[8px] tracking-[2.3px] max-[680px]:text-[6px]"
            >GERAS MAISTAS ARČIAU</small
          ></span
        ></NuxtLink
      >
      <div class="flex items-center gap-6">
        <nav
          class="text-[13px] font-semibold max-[680px]:text-[11px]"
          aria-label="Pagrindinė navigacija"
        >
          <NuxtLink class="border-b border-current py-2" to="/#katalogas"
            >Produktai</NuxtLink
          >
        </nav>
        <CartDrawer />
      </div>
    </header>
    <NuxtLoadingIndicator color="#45633c" />
    <NuxtPage />
  </div>
</template>
