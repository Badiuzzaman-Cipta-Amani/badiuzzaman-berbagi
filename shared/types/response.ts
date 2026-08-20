export type MessageResponse = { message: string }

export type DataResponse<T> = MessageResponse & { data: T }

export type ErrorResponse = MessageResponse & { errors?: Record<string, string[]> }

/** Shape produced by `prisma-extension-pagination`'s `withPages()`. */
export type PaginationMeta = {
  isFirstPage: boolean
  isLastPage: boolean
  currentPage: number
  previousPage: number | null
  nextPage: number | null
  pageCount: number
  totalCount: number
}

export type PaginationResponse<T> = MessageResponse & {
  data: T[]
  meta: PaginationMeta
}
