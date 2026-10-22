<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "~/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
const modelValue = defineModel<string | number>();
</script>

<template>
  <UiInput
    v-model="modelValue"
    v-bind="$attrs"
    data-slot="input-group-control"
    :class="
      cn(
        'flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0',
        props.class,
      )
    "
  />
</template>
