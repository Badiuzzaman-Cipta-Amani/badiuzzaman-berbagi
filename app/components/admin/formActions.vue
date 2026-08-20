<script setup lang="ts">
/**
 * The bar every admin form ends in, docked to the bottom of the dashboard
 * panel's scroll region so the save button stays reachable from anywhere in a
 * long form.
 *
 * Two details are what stop it reading as a button hovering over the page:
 *
 * - It bleeds through the panel's gutter (`-mx-5 sm:-mx-7`) so its rule spans
 *   the full width instead of stopping short on both sides.
 * - The form hosting it must cancel the panel's bottom padding with
 *   `-mb-5 sm:-mb-7`. A sticky box cannot be pushed past its containing block,
 *   so without that the bar detaches at the end of the scroll and floats one
 *   gutter above the bottom edge — which is exactly what it looked like before.
 *
 * On a phone the actions stack full width in source order, which puts the
 * primary one last and therefore nearest the thumb; the row this replaced left
 * a lone button adrift in an otherwise empty strip.
 */
defineProps<{ hint?: string }>()
</script>

<template>
  <div
    class="sticky bottom-0 z-20 -mx-5 mt-6 border-t border-default bg-default/95 px-5 py-3.5 backdrop-blur-md sm:-mx-7 sm:px-7"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p v-if="hint" class="hidden text-sm text-muted sm:block">{{ hint }}</p>

      <div class="flex flex-col gap-2.5 sm:ms-auto sm:flex-row sm:items-center">
        <slot />
      </div>
    </div>
  </div>
</template>
