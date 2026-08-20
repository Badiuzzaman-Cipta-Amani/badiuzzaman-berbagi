export const constructKeyPayload = (data: unknown): string => {
  if (data === null || data === undefined) return ""
  if (Array.isArray(data))
    return data.map((value) => constructKeyPayload(value)).join("-")
  if (isPlainObject(data)) {
    return Object.keys(data)
      .sort()
      .map((key) => `${key}=${constructKeyPayload(data[key])}`)
      .join("&")
  }

  return `${data}`
}

/**
 * Builds the cache key a service hands to `useQuery`. Keys are derived from the
 * request itself so two components asking for the same data share one fetch.
 */
export const generateKey = (method: string, resource: string, ...actions: unknown[]) => {
  const action = actions.map((value) => constructKeyPayload(value)).join(":")
  return `${method}:${resource}:${action}`
}
