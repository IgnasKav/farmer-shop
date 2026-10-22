<script setup lang="ts">
defineProps<{ name: string; size?: number }>()
const paths: Record<string, string> = {
  leaf: "M20 4C10 2 3 8 5 15c3 7 15 5 15-11ZM5 20l9-10M9 15v-5m0 5h5",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  close: "m6 6 12 12M6 18 18 6",
  filter: "M4 7h16M4 17h16M8 4v6m8 4v6",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  check: "m5 12 4 4L19 6"
}
</script>
<template>
  <svg
    :width="size || 20"
    :height="size || 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.leaf" />
  </svg>
</template>
