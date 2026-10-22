<script setup lang="ts">
defineProps<{ error: { statusCode?: number; statusMessage?: string } }>()
</script>
<template>
  <main class="mx-auto my-[15vh] max-w-[700px] p-[30px] [&>h1]:font-serif [&>h1]:text-[50px] [&>p]:leading-relaxed [&>p]:text-muted max-[680px]:[&>h1]:text-[38px]">
    <span class="text-[10px] font-semibold tracking-[1.5px] text-muted">ŪKIO KRAUTUVĖ</span>
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
    <button class="inline-flex min-h-11 items-center justify-center gap-7 rounded bg-green px-5 py-3.5 text-xs font-semibold text-white hover:bg-[#29442d]" @click="clearError({ redirect: '/' })">
      Grįžti į katalogą →
    </button>
  </main>
</template>
