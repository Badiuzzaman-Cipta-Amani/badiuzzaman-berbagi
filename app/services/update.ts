import type { QueryOptions } from "~/types/fetch"

import { generateKey } from "~/utils/api"

const resource = "updates"

export const getListUpdate = (config?: Pick<ListUpdate, "query">) => {
  const query = ref<Required<ListUpdate>["query"]>({ size: config?.query?.size ?? 15 })

  const key = computed(() => generateKey("GET", resource, "list", query.value))

  const run = (options?: QueryOptions<ListUpdate["response"]>) =>
    useQuery<ListUpdate["response"]>("/updates", { key, query, ...options })

  return { query, key, run }
}
