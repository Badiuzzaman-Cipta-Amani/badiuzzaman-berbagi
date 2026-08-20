import type { MutationRunOptions, QueryOptions } from "~/types/fetch"

import { generateKey } from "~/utils/api"

const resource = "admin/duas"

export const getPaginateAdminDua = (config?: Pick<PaginateAdminDua, "query">) => {
  const query = ref<Required<PaginateAdminDua>["query"]>({
    page: config?.query?.page ?? 1,
    size: config?.query?.size ?? 15,
    search: config?.query?.search ?? "",
    visibility: config?.query?.visibility ?? "",
  })

  const key = computed(() => generateKey("GET", resource, "paginate", query.value))

  const run = (options?: QueryOptions<PaginateAdminDua["response"]>) =>
    useQuery<PaginateAdminDua["response"]>("/admin/duas", { key, query, ...options })

  return { query, key, run }
}

export const patchAdminDuaVisibility = (config?: Pick<ToggleAdminDua, "params">) => {
  const params = ref<ToggleAdminDua["params"]>({ id: config?.params?.id ?? "" })
  const body = ref<ToggleAdminDua["body"]>({ isDuaHidden: true })

  const run = (
    options?: MutationRunOptions<ToggleAdminDua["response"], ToggleAdminDua["body"]>,
  ) =>
    useMutation<ToggleAdminDua["response"], ToggleAdminDua["body"]>(
      () => `/admin/duas/${params.value.id}/visibility`,
      { method: "PATCH", body, ...options },
    )

  return { params, body, run }
}
