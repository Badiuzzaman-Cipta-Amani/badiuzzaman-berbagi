<script setup lang="ts">
/**
 * A `UScrollArea` that asks for the next page as the reader nears its end, so a
 * list grows in place instead of paging. The element that scrolls is the one
 * that must be listened to, which is why this owns the scroll area rather than
 * leaving it to the page and watching the window.
 *
 * It only reports "I am near the end" — what a page is and when it arrives stays
 * with `useInfiniteList` and the service behind it.
 */
const {
  hasMore = false,
  loading = false,
  distance = 240,
} = defineProps<{
  /** Whether a next page exists; the scroll stops asking once it does not. */
  hasMore?: boolean
  /** A next page is already in flight. */
  loading?: boolean
  /** How close to the end, in pixels, the next page is asked for. */
  distance?: number
}>()

const emit = defineEmits<{
  loadMore: []
}>()

const scroller = useTemplateRef("scroller")

useInfiniteScroll(
  () => scroller.value?.$el as HTMLElement | null,
  () => emit("loadMore"),
  {
    distance,
    canLoadMore: () => hasMore && !loading,
  },
)
</script>

<template>
  <UScrollArea ref="scroller">
    <slot />

    <div v-if="loading" class="flex justify-center py-5">
      <UIcon
        name="i-material-symbols-progress-activity"
        class="size-6 animate-spin text-dimmed"
      />
      <span class="sr-only">Memuat data berikutnya</span>
    </div>
  </UScrollArea>
</template>
