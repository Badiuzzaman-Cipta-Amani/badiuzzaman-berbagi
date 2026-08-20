import type { QueryOptions } from "~/types/fetch"

import { generateKey } from "~/utils/api"

const resource = "duas"

export const getListDua = (config?: Pick<ListDua, "query">) => {
  const query = ref<Required<ListDua>["query"]>({ size: config?.query?.size ?? 15 })

  const key = computed(() => generateKey("GET", resource, "list", query.value))

  const run = (options?: QueryOptions<ListDua["response"]>) =>
    useQuery<ListDua["response"]>("/duas", { key, query, ...options })

  return { query, key, run }
}
