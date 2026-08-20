import type { MutationRunOptions, QueryOptions } from "~/types/fetch"

import { adminUserCreateSchema, adminUserUpdateSchema } from "~~/shared/validation/admin"

import { generateKey } from "~/utils/api"

const resource = "admin/users"

export const getPaginateAdminUser = (config?: Pick<PaginateAdminUser, "query">) => {
  const query = ref<Required<PaginateAdminUser>["query"]>({
    page: config?.query?.page ?? 1,
    size: config?.query?.size ?? 15,
    search: config?.query?.search ?? "",
    sort: config?.query?.sort ?? "latest",
  })

  const key = computed(() => generateKey("GET", resource, "paginate", query.value))

  const run = (options?: QueryOptions<PaginateAdminUser["response"]>) =>
    useQuery<PaginateAdminUser["response"]>("/admin/users", { key, query, ...options })

  return { query, key, run }
}

export const getDetailAdminUser = (config?: Pick<DetailAdminUser, "params">) => {
  const params = ref<DetailAdminUser["params"]>({ id: config?.params?.id ?? "" })

  const key = computed(() => generateKey("GET", resource, "detail", params.value.id))

  const run = (options?: QueryOptions<DetailAdminUser["response"]>) =>
    useQuery<DetailAdminUser["response"]>(() => `/admin/users/${params.value.id}`, {
      key,
      immediate: Boolean(params.value.id),
      ...options,
    })

  return { params, key, run }
}

export const postAdminUser = () => {
  const body = ref<CreateAdminUser["body"]>({
    name: "",
    email: "",
    phone: "",
    password: "",
  })

  const run = (
    options?: MutationRunOptions<CreateAdminUser["response"], CreateAdminUser["body"]>,
  ) =>
    useMutation<CreateAdminUser["response"], CreateAdminUser["body"]>("/admin/users", {
      method: "POST",
      body,
      ...options,
    })

  return { body, validation: adminUserCreateSchema, run }
}

export const putAdminUser = (config?: Pick<UpdateAdminUser, "params">) => {
  const params = ref<UpdateAdminUser["params"]>({ id: config?.params?.id ?? "" })
  const body = ref<UpdateAdminUser["body"]>({
    name: "",
    email: "",
    phone: "",
    password: "",
  })

  const run = (
    options?: MutationRunOptions<UpdateAdminUser["response"], UpdateAdminUser["body"]>,
  ) =>
    useMutation<UpdateAdminUser["response"], UpdateAdminUser["body"]>(
      () => `/admin/users/${params.value.id}`,
      { method: "PUT", body, ...options },
    )

  return { params, body, validation: adminUserUpdateSchema, run }
}

export const deleteAdminUser = (config?: Pick<DeleteAdminUser, "params">) => {
  const params = ref<DeleteAdminUser["params"]>({ id: config?.params?.id ?? "" })

  const run = (options?: MutationRunOptions<DeleteAdminUser["response"], undefined>) =>
    useMutation<DeleteAdminUser["response"], undefined>(
      () => `/admin/users/${params.value.id}`,
      { method: "DELETE", ...options },
    )

  return { params, run }
}
