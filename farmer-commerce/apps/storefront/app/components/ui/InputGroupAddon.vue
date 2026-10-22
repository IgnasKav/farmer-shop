<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "~/lib/utils";

type InputGroupAddonAlign =
  | "inline-start"
  | "inline-end"
  | "block-start"
  | "block-end";

const props = withDefaults(
  defineProps<{ class?: HTMLAttributes["class"]; align?: InputGroupAddonAlign }>(),
  { align: "inline-start" },
);

const alignClasses: Record<InputGroupAddonAlign, string> = {
  "inline-start": "order-first pl-3 has-[>button]:ml-[-0.45rem]",
  "inline-end": "order-last pr-3 has-[>button]:mr-[-0.45rem]",
  "block-start":
    "order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5",
  "block-end":
    "order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5",
};

function focusInput(event: MouseEvent) {
  if ((event.target as HTMLElement).closest("button")) return;
  (event.currentTarget as HTMLElement).parentElement
    ?.querySelector("input")
    ?.focus();
}
</script>

<template>
  <div
    role="group"
    data-slot="input-group-addon"
    :data-align="props.align"
    :class="
      cn(
        'flex h-auto cursor-text select-none items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground group-data-[disabled=true]/input-group:opacity-50 [&>svg:not([class*=\'size-\'])]:size-4',
        alignClasses[props.align],
        props.class,
      )
    "
    @click="focusInput"
  >
    <slot />
  </div>
</template>
