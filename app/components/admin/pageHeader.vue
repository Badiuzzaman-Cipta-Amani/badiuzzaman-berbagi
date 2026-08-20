<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  /** Rendered above the title as a back link, for the detail and form pages. */
  backTo?: string
  backLabel?: string
}>()
</script>

<template>
  <div class="mb-7">
    <UButton
      v-if="backTo"
      :to="backTo"
      :label="backLabel ?? 'Kembali'"
      icon="i-material-symbols-arrow-back-rounded"
      color="neutral"
      variant="link"
      size="md"
      class="-ms-3 mb-1.5"
    />

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">
          {{ title }}
        </h2>
        <p v-if="description" class="mt-1.5 max-w-3xl text-base text-muted">
          {{ description }}
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2.5">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
