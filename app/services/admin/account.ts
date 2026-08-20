import type { MutationRunOptions, QueryOptions } from "~/types/fetch"

import {
  adminAccountCreateSchema,
  adminAccountUpdateSchema,
  adminRoleSchema,
} from "~~/shared/validation/admin"

import { generateKey } from "~/utils/api"

/* Admin accounts ---------------------------------------------------------- */

const accountResource = "admin/accounts"

export const getPaginateAdminAccount = (config?: Pick<PaginateAdminAccount, "query">) => {
  const query = ref<Required<PaginateAdminAccount>["query"]>({
    page: config?.query?.page ?? 1,
    size: config?.query?.size ?? 15,
    search: config?.query?.search ?? "",
    roleId: config?.query?.roleId ?? "",
    status: config?.query?.status ?? "",
  })

  const key = computed(() => generateKey("GET", accountResource, "paginate", query.value))

  const run = (options?: QueryOptions<PaginateAdminAccount["response"]>) =>
    useQuery<PaginateAdminAccount["response"]>("/admin/accounts", {
      key,
      query,
      ...options,
    })

  return { query, key, run }
}

export const postAdminAccount = () => {
  const body = ref<CreateAdminAccount["body"]>({
    name: "",
    email: "",
    password: "",
    roleId: 0,
    isActive: true,
  })

  const run = (
    options?: MutationRunOptions<
      CreateAdminAccount["response"],
      CreateAdminAccount["body"]
    >,
  ) =>
    useMutation<CreateAdminAccount["response"], CreateAdminAccount["body"]>(
      "/admin/accounts",
      { method: "POST", body, ...options },
    )

  return { body, validation: adminAccountCreateSchema, run }
}

export const putAdminAccount = (config?: Pick<UpdateAdminAccount, "params">) => {
  const params = ref<UpdateAdminAccount["params"]>({ id: config?.params?.id ?? "" })
  const body = ref<UpdateAdminAccount["body"]>({
    name: "",
    email: "",
    password: "",
    roleId: 0,
    isActive: true,
  })

  const run = (
    options?: MutationRunOptions<
      UpdateAdminAccount["response"],
      UpdateAdminAccount["body"]
    >,
  ) =>
    useMutation<UpdateAdminAccount["response"], UpdateAdminAccount["body"]>(
      () => `/admin/accounts/${params.value.id}`,
      { method: "PUT", body, ...options },
    )

  return { params, body, validation: adminAccountUpdateSchema, run }
}

export const deleteAdminAccount = (config?: Pick<DeleteAdminAccount, "params">) => {
  const params = ref<DeleteAdminAccount["params"]>({ id: config?.params?.id ?? "" })

  const run = (options?: MutationRunOptions<DeleteAdminAccount["response"], undefined>) =>
    useMutation<DeleteAdminAccount["response"], undefined>(
      () => `/admin/accounts/${params.value.id}`,
      { method: "DELETE", ...options },
    )

  return { params, run }
}

/* Roles ------------------------------------------------------------------- */

const roleResource = "admin/roles"

export const getListAdminRole = () => {
  const key = computed(() => generateKey("GET", roleResource, "list"))

  const run = (options?: QueryOptions<ListAdminRole["response"]>) =>
    useQuery<ListAdminRole["response"]>("/admin/roles", { key, ...options })

  return { key, run }
}

export const postAdminRole = () => {
  const body = ref<CreateAdminRole["body"]>({
    name: "",
    label: "",
    description: "",
    permissions: [],
  })

  const run = (
    options?: MutationRunOptions<CreateAdminRole["response"], CreateAdminRole["body"]>,
  ) =>
    useMutation<CreateAdminRole["response"], CreateAdminRole["body"]>("/admin/roles", {
      method: "POST",
      body,
      ...options,
    })

  return { body, validation: adminRoleSchema, run }
}

export const putAdminRole = (config?: Pick<UpdateAdminRole, "params">) => {
  const params = ref<UpdateAdminRole["params"]>({ id: config?.params?.id ?? "" })
  const body = ref<UpdateAdminRole["body"]>({
    name: "",
    label: "",
    description: "",
    permissions: [],
  })

  const run = (
    options?: MutationRunOptions<UpdateAdminRole["response"], UpdateAdminRole["body"]>,
  ) =>
    useMutation<UpdateAdminRole["response"], UpdateAdminRole["body"]>(
      () => `/admin/roles/${params.value.id}`,
      { method: "PUT", body, ...options },
    )

  return { params, body, validation: adminRoleSchema, run }
}

export const deleteAdminRole = (config?: Pick<DeleteAdminRole, "params">) => {
  const params = ref<DeleteAdminRole["params"]>({ id: config?.params?.id ?? "" })

  const run = (options?: MutationRunOptions<DeleteAdminRole["response"], undefined>) =>
    useMutation<DeleteAdminRole["response"], undefined>(
      () => `/admin/roles/${params.value.id}`,
      { method: "DELETE", ...options },
    )

  return { params, run }
}
