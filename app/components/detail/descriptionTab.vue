<script setup lang="ts">
defineProps<{
  description: string
  latestUpdate: UpdateItem | null
}>()
</script>

<template>
  <div class="space-y-5">
    <BaseMarkdown :source="description" />

    <UAlert
      v-if="latestUpdate"
      color="info"
      variant="subtle"
      icon="i-material-symbols-menu-book-rounded"
      :title="latestUpdate.title"
    >
      <template #description>
        <BaseMarkdown :source="latestUpdate.description" />
        <time class="mt-2 block text-xs opacity-80" :datetime="latestUpdate.createdAt">
          Diperbarui {{ formatRelativeTime(latestUpdate.createdAt) }}
        </time>
      </template>
    </UAlert>
  </div>
</template>
