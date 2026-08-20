import type { MutationRunOptions, QueryOptions } from "~/types/fetch"

import { adminCampaignSchema } from "~~/shared/validation/admin"

import { generateKey } from "~/utils/api"

const resource = "admin/campaigns"

/** The blank campaign form, shared by the create page and the edit page's reset. */
export const emptyAdminCampaignBody = (): AdminCampaignBody => ({
  title: "",
  slug: "",
  category: "social",
  excerpt: "",
  description: "",
  location: "",
  mapsUrl: "",
  targetAmount: 1_000_000,
  status: "draft",
  endAt: null,
  fundraiserId: null,
  images: [],
})

export const getPaginateAdminCampaign = (
  config?: Pick<PaginateAdminCampaign, "query">,
) => {
  const query = ref<Required<PaginateAdminCampaign>["query"]>({
    page: config?.query?.page ?? 1,
    size: config?.query?.size ?? 15,
    search: config?.query?.search ?? "",
    status: config?.query?.status ?? "",
    category: config?.query?.category ?? "",
    sort: config?.query?.sort ?? "latest",
  })

  const key = computed(() => generateKey("GET", resource, "paginate", query.value))

  const run = (options?: QueryOptions<PaginateAdminCampaign["response"]>) =>
    useQuery<PaginateAdminCampaign["response"]>("/admin/campaigns", {
      key,
      query,
      ...options,
    })

  return { query, key, run }
}

export const getDetailAdminCampaign = (config?: Pick<DetailAdminCampaign, "params">) => {
  const params = ref<DetailAdminCampaign["params"]>({ id: config?.params?.id ?? "" })

  const key = computed(() => generateKey("GET", resource, "detail", params.value.id))

  const run = (options?: QueryOptions<DetailAdminCampaign["response"]>) =>
    useQuery<DetailAdminCampaign["response"]>(
      () => `/admin/campaigns/${params.value.id}`,
      { key, immediate: Boolean(params.value.id), ...options },
    )

  return { params, key, run }
}

export const postAdminCampaign = () => {
  const body = ref<CreateAdminCampaign["body"]>(emptyAdminCampaignBody())

  const run = (
    options?: MutationRunOptions<
      CreateAdminCampaign["response"],
      CreateAdminCampaign["body"]
    >,
  ) =>
    useMutation<CreateAdminCampaign["response"], CreateAdminCampaign["body"]>(
      "/admin/campaigns",
      { method: "POST", body, ...options },
    )

  return { body, validation: adminCampaignSchema, run }
}

export const putAdminCampaign = (config?: Pick<UpdateAdminCampaign, "params">) => {
  const params = ref<UpdateAdminCampaign["params"]>({ id: config?.params?.id ?? "" })
  const body = ref<UpdateAdminCampaign["body"]>(emptyAdminCampaignBody())

  const run = (
    options?: MutationRunOptions<
      UpdateAdminCampaign["response"],
      UpdateAdminCampaign["body"]
    >,
  ) =>
    useMutation<UpdateAdminCampaign["response"], UpdateAdminCampaign["body"]>(
      () => `/admin/campaigns/${params.value.id}`,
      { method: "PUT", body, ...options },
    )

  return { params, body, validation: adminCampaignSchema, run }
}

export const deleteAdminCampaign = (config?: Pick<DeleteAdminCampaign, "params">) => {
  const params = ref<DeleteAdminCampaign["params"]>({ id: config?.params?.id ?? "" })

  const run = (
    options?: MutationRunOptions<DeleteAdminCampaign["response"], undefined>,
  ) =>
    useMutation<DeleteAdminCampaign["response"], undefined>(
      () => `/admin/campaigns/${params.value.id}`,
      { method: "DELETE", ...options },
    )

  return { params, run }
}
