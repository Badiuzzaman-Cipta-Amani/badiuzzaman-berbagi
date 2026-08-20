import type { MutationRunOptions, QueryOptions } from "~/types/fetch"

import { donateSchema } from "~~/shared/validation/donate"

import { generateKey } from "~/utils/api"

const resource = "campaigns"

/**
 * Services own their request state. Callers mutate the returned `query`/`params`
 * refs and `useQuery` refetches, because the refs are handed to it directly.
 */
export const getPaginateCampaign = (config?: Pick<PaginateCampaign, "query">) => {
  const query = ref<Required<PaginateCampaign>["query"]>({
    page: config?.query?.page ?? 1,
    size: config?.query?.size ?? 15,
    search: config?.query?.search ?? "",
    category: config?.query?.category ?? "",
    sort: config?.query?.sort ?? "latest",
  })

  const key = computed(() => generateKey("GET", resource, "paginate", query.value))

  const run = (options?: QueryOptions<PaginateCampaign["response"]>) =>
    useQuery<PaginateCampaign["response"]>("/campaigns", { key, query, ...options })

  return { query, key, run }
}

export const getDetailCampaign = (config?: Pick<DetailCampaign, "params">) => {
  const params = ref<DetailCampaign["params"]>({ slug: config?.params?.slug ?? "" })

  const key = computed(() => generateKey("GET", resource, "detail", params.value.slug))

  const run = (options?: QueryOptions<DetailCampaign["response"]>) =>
    useQuery<DetailCampaign["response"]>(() => `/campaigns/${params.value.slug}`, {
      key,
      immediate: Boolean(params.value.slug),
      ...options,
    })

  return { params, key, run }
}

export const getCriticalCampaign = () => {
  const key = computed(() => generateKey("GET", resource, "critical"))

  const run = (options?: QueryOptions<CriticalCampaign["response"]>) =>
    useQuery<CriticalCampaign["response"]>("/campaigns/critical", { key, ...options })

  return { key, run }
}

export const getPaginateCampaignDua = (
  config?: Pick<PaginateCampaignDua, "params" | "query">,
) => {
  const params = ref<PaginateCampaignDua["params"]>({ slug: config?.params?.slug ?? "" })
  const query = ref<Required<PaginateCampaignDua>["query"]>({
    page: config?.query?.page ?? 1,
    size: config?.query?.size ?? 15,
  })

  const key = computed(() =>
    generateKey("GET", resource, "duas", params.value.slug, query.value),
  )

  const run = (options?: QueryOptions<PaginateCampaignDua["response"]>) =>
    useQuery<PaginateCampaignDua["response"]>(
      () => `/campaigns/${params.value.slug}/duas`,
      {
        key,
        query,
        immediate: Boolean(params.value.slug),
        ...options,
      },
    )

  return { params, query, key, run }
}

export const getListCampaignUpdate = (config?: Pick<ListCampaignUpdate, "params">) => {
  const params = ref<ListCampaignUpdate["params"]>({ slug: config?.params?.slug ?? "" })

  const key = computed(() => generateKey("GET", resource, "updates", params.value.slug))

  const run = (options?: QueryOptions<ListCampaignUpdate["response"]>) =>
    useQuery<ListCampaignUpdate["response"]>(
      () => `/campaigns/${params.value.slug}/updates`,
      { key, immediate: Boolean(params.value.slug), ...options },
    )

  return { params, key, run }
}

export const postDonateCampaign = (config?: {
  params?: DonateCampaign["params"]
  body?: Partial<DonateCampaign["body"]>
}) => {
  const params = ref<DonateCampaign["params"]>({ slug: config?.params?.slug ?? "" })
  const body = ref<DonateCampaign["body"]>({
    donorNames: config?.body?.donorNames ?? [],
    message: config?.body?.message ?? "",
    amount: config?.body?.amount ?? 0,
  })

  const run = (
    options?: MutationRunOptions<DonateCampaign["response"], DonateCampaign["body"]>,
  ) =>
    useMutation<DonateCampaign["response"], DonateCampaign["body"]>(
      () => `/campaigns/${params.value.slug}/donate`,
      { method: "POST", body, ...options },
    )

  return { params, body, validation: donateSchema, run }
}
