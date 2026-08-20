<script setup lang="ts">
defineProps<{
  duas: DuaItem[]
  loading?: boolean
  hasMore?: boolean
  loadingMore?: boolean
}>()

const emit = defineEmits<{
  loadMore: []
}>()
</script>

<template>
  <div v-if="loading" class="space-y-3">
    <div v-for="n in 3" :key="n" class="rounded-2xl border border-default p-4">
      <div class="flex items-start gap-3">
        <USkeleton class="size-10 shrink-0 rounded-full" />
        <div class="flex-1">
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="mt-3 h-3 w-full" />
          <USkeleton class="mt-2 h-3 w-3/4" />
        </div>
      </div>
    </div>
  </div>

  <UEmpty
    v-else-if="!duas.length"
    icon="i-material-symbols-favorite-outline-rounded"
    title="Belum ada doa"
    description="Jadilah yang pertama mengirim doa untuk program ini."
  />

  <!--
    The feed is capped and scrolls inside itself: a campaign with hundreds of
    duas would otherwise push the donate bar off the end of the page.
  -->
  <BaseInfiniteScroll
    v-else
    class="max-h-[70vh] pe-1"
    :has-more="hasMore"
    :loading="loadingMore"
    @load-more="emit('loadMore')"
  >
    <ul class="space-y-3">
      <li v-for="dua in duas" :key="dua.id">
        <DuaCard :dua="dua" />
      </li>
    </ul>
  </BaseInfiniteScroll>
</template>
