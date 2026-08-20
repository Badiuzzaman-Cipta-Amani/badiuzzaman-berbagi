import type { UseFetchOptions } from "#app"
import type { FetchError } from "ofetch"

/**
 * Options a caller may still pass to a query service. Anything the service
 * itself owns — url, method, key, query/params — is deliberately omitted.
 */
export type QueryOptions<T> = Omit<
  UseFetchOptions<T>,
  "body" | "query" | "params" | "method" | "key" | "baseURL"
>

export type MutationMethod = "POST" | "PUT" | "PATCH" | "DELETE"

export type MutationStatus = "idle" | "pending" | "success" | "error"

export type MutationOptions<TResponse, TBody> = {
  method?: MutationMethod
  body?: MaybeRefOrGetter<TBody>
  query?: MaybeRefOrGetter<Record<string, unknown>>
  headers?: Record<string, string>
  onSuccess?: (data: TResponse) => void | Promise<void>
  onError?: (error: FetchError) => void | Promise<void>
}

/** What a caller may override on a mutation service; the body stays owned by the service. */
export type MutationRunOptions<TResponse, TBody> = Omit<
  MutationOptions<TResponse, TBody>,
  "method" | "body"
>
