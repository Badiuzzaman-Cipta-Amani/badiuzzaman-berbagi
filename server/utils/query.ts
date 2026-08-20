/** Request-query helpers shared by every paginated endpoint. */

export const DEFAULT_PAGE_SIZE = 15
export const MAX_PAGE_SIZE = 50

export function normalizePage(page?: unknown) {
  const value = Number(page ?? 1)
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1
}

export function normalizeSize(size?: unknown, fallback = DEFAULT_PAGE_SIZE) {
  const value = Number(size ?? fallback)
  if (!Number.isFinite(value)) return fallback
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(value)))
}

/**
 * Mirrors what `withPages()` returns, for the rare endpoint that has to page in
 * memory and therefore cannot use `prisma-extension-pagination`.
 */
export function buildPaginationMeta(
  currentPage: number,
  size: number,
  totalCount: number,
): PaginationMeta {
  const pageCount = Math.max(1, Math.ceil(totalCount / size))
  return {
    isFirstPage: currentPage === 1,
    isLastPage: currentPage >= pageCount,
    currentPage,
    previousPage: currentPage > 1 ? currentPage - 1 : null,
    nextPage: currentPage < pageCount ? currentPage + 1 : null,
    pageCount,
    totalCount,
  }
}
