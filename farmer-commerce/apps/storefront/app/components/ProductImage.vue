<script setup lang="ts">
const props = defineProps<{
  src?: string | null
  alt: string
  eager?: boolean
}>()
const failed = ref(false)
watch(
  () => props.src,
  () => {
    failed.value = false
  }
)
</script>
<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
    @error="failed = true"
  />
  <div v-else class="image-placeholder" role="img" :aria-label="alt">
    <AppIcon name="leaf" :size="48" /><span>Gėrybės jūsų stalui</span>
  </div>
</template>
