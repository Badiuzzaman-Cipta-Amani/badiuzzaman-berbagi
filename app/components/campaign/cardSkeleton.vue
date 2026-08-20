<script setup lang="ts">
/** Mirrors CampaignCard's geometry so the swap from loading to loaded does not jump. */
defineProps<{
  compact?: boolean
}>()
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-default">
    <USkeleton :class="['w-full rounded-none', compact ? 'h-32' : 'h-44']" />
    <div class="p-4">
      <USkeleton class="h-4 w-full" />
      <USkeleton class="mt-2 h-4 w-2/3" />
      <USkeleton class="mt-4 h-5 w-1/2" />
      <USkeleton class="mt-2 h-3 w-1/3" />
      <USkeleton class="mt-3 h-2 w-full" />
      <div class="mt-3 flex justify-between">
        <USkeleton class="h-3 w-20" />
        <USkeleton class="h-3 w-16" />
      </div>
    </div>
  </div>
</template>
