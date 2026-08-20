<script setup lang="ts">
/**
 * The footer under every admin list. It exists so the range sentence and the
 * pager are written once: each screen used to hand-roll a row that showed only
 * a grand total, which never told an operator *where in the list they were*.
 *
 * The two pieces stack vertically and centre — a pager pinned to the right edge
 * of a wide table sits a long way from the count that explains it.
 */
const { meta, size, noun } = defineProps<{
  meta: PaginationMeta
  /** Rows requested per page; the range is derived from it, not from the rows drawn. */
  size: number
  /**
   * What is being counted, in Indonesian: "donasi", "campaign", "donatur".
   * Indonesian does not inflect for number, so one word covers both halves of
   * the sentence.
   */
  noun: string
}>()

const emit = defineEmits<{ "update:page": [page: number] }>()

/**
 * Built as one string rather than as spans around a hyphen: template whitespace
 * would put a space either side of the dash and turn "90-105" into "90 - 105".
 */
const range = computed(() => {
  const from = meta.totalCount === 0 ? 0 : (meta.currentPage - 1) * size + 1
  const to = Math.min(meta.currentPage * size, meta.totalCount)

  return from === to ? formatNumber(from) : `${formatNumber(from)}-${formatNumber(to)}`
})
</script>

<template>
  <div
    v-if="meta.totalCount"
    class="mt-6 flex flex-col items-center gap-4 border-t border-default pt-5"
  >
    <p class="text-center text-base text-muted">
      <span class="numeric font-semibold text-toned">{{ range }}</span>
      {{ noun }} dari
      <span class="numeric font-semibold text-toned">
        {{ formatNumber(meta.totalCount) }}
      </span>
      {{ noun }}
    </p>

    <!--
      `sibling-count` is 2 rather than Nuxt UI's 1: one extra number on each side
      is the difference between jumping page by page and steering with a glance.
    -->
    <UPagination
      v-if="meta.pageCount > 1"
      :page="meta.currentPage"
      :total="meta.totalCount"
      :items-per-page="size"
      :sibling-count="2"
      size="md"
      @update:page="emit('update:page', $event)"
    />
  </div>
</template>
