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
  <div v-else class="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 bg-[#ecefe5] text-[#8a997c] [&>span]:font-serif [&>span]:text-base" role="img" :aria-label="alt">
    <AppIcon name="leaf" :size="48" /><span>GÄ—rybÄ—s jÅ«sÅ³ stalui</span>
  </div>
</template>
