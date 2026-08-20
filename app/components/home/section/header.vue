<script setup lang="ts">
defineProps<{
  title: string
  to?: string
  linkLabel?: string
}>()
</script>

<template>
  <div class="mb-3 flex items-baseline justify-between gap-4 px-gutter">
    <h2 class="text-lg leading-tight font-bold tracking-tight text-highlighted">
      {{ title }}
    </h2>
    <UButton
      v-if="to"
      :to="to"
      :label="linkLabel ?? 'Lihat semua'"
      color="primary"
      variant="link"
      size="sm"
      trailing-icon="i-material-symbols-arrow-forward-rounded"
      :ui="{ base: 'shrink-0 px-0 gap-1' }"
    />
  </div>
</template>
