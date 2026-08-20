import type { QueryOptions } from "~/types/fetch"

import { generateKey } from "~/utils/api"

const resource = "admin/dashboard"

export const getAdminDashboard = (config?: Pick<GetAdminDashboard, "query">) => {
  const query = ref<Required<GetAdminDashboard>["query"]>({
    days: config?.query?.days ?? 30,
  })

  const key = computed(() => generateKey("GET", resource, query.value))

  const run = (options?: QueryOptions<GetAdminDashboard["response"]>) =>
    useQuery<GetAdminDashboard["response"]>("/admin/dashboard", {
      key,
      query,
      ...options,
    })

  return { query, key, run }
}
