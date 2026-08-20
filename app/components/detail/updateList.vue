<script setup lang="ts">
const { updates, loading = false } = defineProps<{
  updates: UpdateItem[]
  loading?: boolean
}>()

/**
 * Updates are a chronology, so they render as a timeline rather than a stack of
 * identical cards — the connecting rail is the information. The body is
 * Markdown from the admin editor, so it goes through the `#description` slot
 * instead of the plain string prop.
 */
const items = computed(() =>
  updates.map((update) => ({
    date: formatDate(update.createdAt),
    title: update.title,
    description: update.description,
    icon: "i-material-symbols-check-rounded",
  })),
)
</script>

<template>
  <div v-if="loading" class="space-y-6">
    <div v-for="n in 2" :key="n" class="flex gap-4">
      <USkeleton class="size-8 shrink-0 rounded-full" />
      <div class="flex-1">
        <USkeleton class="h-3 w-28" />
        <USkeleton class="mt-2 h-4 w-3/5" />
        <USkeleton class="mt-3 h-3 w-full" />
        <USkeleton class="mt-2 h-3 w-4/5" />
      </div>
    </div>
  </div>

  <UEmpty
    v-else-if="!updates.length"
    icon="i-material-symbols-campaign-outline-rounded"
    title="Belum ada kabar"
    description="Penggalang akan mengabarkan perkembangan program di sini."
  />

  <UTimeline
    v-else
    :items="items"
    :default-value="items.length"
    color="primary"
    size="sm"
  >
    <template #description="{ item }">
      <BaseMarkdown :source="item.description" />
    </template>
  </UTimeline>
</template>
