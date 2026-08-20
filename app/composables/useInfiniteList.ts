import type { AsyncDataRequestStatus } from "#app"

/** The one field this composable is allowed to write on a service's query ref. */
type InfiniteListQuery = { page?: number }

type InfiniteListOptions<TItem, TQuery extends InfiniteListQuery> = {
  /** The service's own query ref — only `page` is ever written back to it. */
  query: Ref<TQuery>
  data: () => PaginationResponse<TItem> | null | undefined
  status: () => AsyncDataRequestStatus
}

/**
 * Keeps the pages a paginated service has already returned instead of letting
 * the next one replace them, so a list grows as the reader scrolls.
 *
 * The service still owns the request — this only decides which responses are
 * kept and when the pile is thrown away. Changing any filter on the query ref
 * drops it and starts again at page 1, because the rows behind the old filter
 * are no longer the rows on screen.
 */
export const useInfiniteList = <TItem, TQuery extends InfiniteListQuery>(
  options: InfiniteListOptions<TItem, TQuery>,
) => {
  const { query } = options

  const pages = shallowRef(new Map<number, TItem[]>())
  const meta = shallowRef<PaginationMeta | null>(null)

  const items = computed(() =>
    [...pages.value.keys()]
      .sort((a, b) => a - b)
      .flatMap((page) => pages.value.get(page) ?? []),
  )

  const pending = computed(() => options.status() === "pending")
  const hasMore = computed(() => Boolean(meta.value?.nextPage))

  /** A first load may blank the list; a next page must not. */
  const loading = computed(() => pending.value && !items.value.length)
  const loadingMore = computed(() => pending.value && items.value.length > 0)

  const reset = () => {
    pages.value = new Map()
    meta.value = null
    query.value.page = 1
  }

  const loadMore = () => {
    if (pending.value || !meta.value?.nextPage) return

    query.value.page = meta.value.nextPage
  }

  /** Everything except `page`: when this changes, what is on screen is stale. */
  const filterKey = computed(() =>
    JSON.stringify(
      Object.entries(query.value)
        .filter(([key]) => key !== "page")
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  )

  watch(filterKey, reset)

  watch(
    options.data,
    (response) => {
      // A response for a page we have already left is the leftover of a filter
      // that changed mid-flight; splicing it in would show stale rows.
      if (!response || response.meta.currentPage !== (query.value.page ?? 1)) return

      const next = new Map(pages.value)
      next.set(response.meta.currentPage, response.data)

      pages.value = next
      meta.value = response.meta
    },
    { immediate: true },
  )

  return { items, meta, pending, loading, loadingMore, hasMore, loadMore, reset }
}
