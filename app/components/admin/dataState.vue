<script setup lang="ts">
/**
 * The loading / error / empty triad every admin list repeats. Wrapping it once
 * keeps a failed request from silently rendering as "no data".
 */
defineProps<{
  loading?: boolean
  error?: unknown
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: string
  /** How many skeleton rows to draw while the first page loads. */
  skeletonRows?: number
}>()

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div v-if="loading" class="space-y-3">
    <USkeleton v-for="n in skeletonRows ?? 6" :key="n" class="h-16 w-full rounded-lg" />
  </div>

  <UAlert
    v-else-if="error"
    color="error"
    variant="subtle"
    icon="i-material-symbols-cloud-off-rounded"
    title="Gagal memuat data"
    description="Periksa koneksi Anda, lalu coba lagi."
    :actions="[
      {
        label: 'Coba lagi',
        color: 'error',
        variant: 'solid',
        onClick: () => emit('retry'),
      },
    ]"
  />

  <UEmpty
    v-else-if="empty"
    :icon="emptyIcon ?? 'i-material-symbols-inbox-rounded'"
    :title="emptyTitle ?? 'Belum ada data'"
    :description="emptyDescription"
  />

  <slot v-else />
</template>
