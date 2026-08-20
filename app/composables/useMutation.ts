import type { FetchError } from "ofetch"
import type { MutationOptions, MutationStatus } from "~/types/fetch"

/**
 * Write counterpart to `useQuery`: same base URL, but imperative — nothing is
 * sent until `execute()` is called. Late responses from superseded calls are
 * discarded so a slow first submit cannot overwrite a fast second one.
 */
export const useMutation = <TResponse = unknown, TBody = unknown>(
  url: MaybeRefOrGetter<string>,
  options: MutationOptions<TResponse, TBody> = {},
) => {
  const data = shallowRef<TResponse | null>(null)
  const error = shallowRef<FetchError | null>(null)
  const status = ref<MutationStatus>("idle")
  const pending = computed(() => status.value === "pending")

  let callId = 0

  const reset = () => {
    callId++
    data.value = null
    error.value = null
    status.value = "idle"
  }

  const execute = async (overrides: Partial<MutationOptions<TResponse, TBody>> = {}) => {
    const id = ++callId
    const merged = { ...options, ...overrides }

    status.value = "pending"
    error.value = null

    try {
      const result = (await $fetch(toValue(url), {
        baseURL: useRuntimeConfig().public.apiBase,
        method: merged.method ?? "POST",
        body: toValue(merged.body) as Record<string, unknown> | undefined,
        query: toValue(merged.query),
        headers: merged.headers,
      })) as TResponse

      if (id === callId) {
        data.value = result
        status.value = "success"
        await merged.onSuccess?.(result)
      }

      return result
    } catch (err) {
      if (id === callId) {
        error.value = err as FetchError
        status.value = "error"
        await merged.onError?.(err as FetchError)
      }

      throw err
    }
  }

  return { data, error, status, pending, execute, reset }
}
