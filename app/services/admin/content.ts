import type { MutationRunOptions, QueryOptions } from "~/types/fetch"

import {
  adminCampaignUpdateSchema,
  adminFundraiserSchema,
} from "~~/shared/validation/admin"

import { generateKey } from "~/utils/api"

/* Fundraisers ------------------------------------------------------------- */

const fundraiserResource = "admin/fundraisers"

export const getPaginateAdminFundraiser = (
  config?: Pick<PaginateAdminFundraiser, "query">,
) => {
  const query = ref<Required<PaginateAdminFundraiser>["query"]>({
    page: config?.query?.page ?? 1,
    size: config?.query?.size ?? 15,
    search: config?.query?.search ?? "",
  })

  const key = computed(() =>
    generateKey("GET", fundraiserResource, "paginate", query.value),
  )

  const run = (options?: QueryOptions<PaginateAdminFundraiser["response"]>) =>
    useQuery<PaginateAdminFundraiser["response"]>("/admin/fundraisers", {
      key,
      query,
      ...options,
    })

  return { query, key, run }
}

/** Feeds the campaign form's fundraiser picker, which needs every option at once. */
export const getListAdminFundraiser = () => {
  const key = computed(() => generateKey("GET", fundraiserResource, "all"))

  const run = (options?: QueryOptions<ListAdminFundraiser["response"]>) =>
    useQuery<ListAdminFundraiser["response"]>("/admin/fundraisers/all", {
      key,
      ...options,
    })

  return { key, run }
}

export const postAdminFundraiser = () => {
  const body = ref<CreateAdminFundraiser["body"]>({ name: "", googleMaps: "" })

  const run = (
    options?: MutationRunOptions<
      CreateAdminFundraiser["response"],
      CreateAdminFundraiser["body"]
    >,
  ) =>
    useMutation<CreateAdminFundraiser["response"], CreateAdminFundraiser["body"]>(
      "/admin/fundraisers",
      { method: "POST", body, ...options },
    )

  return { body, validation: adminFundraiserSchema, run }
}

export const putAdminFundraiser = (config?: Pick<UpdateAdminFundraiser, "params">) => {
  const params = ref<UpdateAdminFundraiser["params"]>({ id: config?.params?.id ?? "" })
  const body = ref<UpdateAdminFundraiser["body"]>({ name: "", googleMaps: "" })

  const run = (
    options?: MutationRunOptions<
      UpdateAdminFundraiser["response"],
      UpdateAdminFundraiser["body"]
    >,
  ) =>
    useMutation<UpdateAdminFundraiser["response"], UpdateAdminFundraiser["body"]>(
      () => `/admin/fundraisers/${params.value.id}`,
      { method: "PUT", body, ...options },
    )

  return { params, body, validation: adminFundraiserSchema, run }
}

export const deleteAdminFundraiser = (config?: Pick<DeleteAdminFundraiser, "params">) => {
  const params = ref<DeleteAdminFundraiser["params"]>({ id: config?.params?.id ?? "" })

  const run = (
    options?: MutationRunOptions<DeleteAdminFundraiser["response"], undefined>,
  ) =>
    useMutation<DeleteAdminFundraiser["response"], undefined>(
      () => `/admin/fundraisers/${params.value.id}`,
      { method: "DELETE", ...options },
    )

  return { params, run }
}

/* Campaign updates -------------------------------------------------------- */

const updateResource = "admin/updates"

export const getPaginateAdminCampaignUpdate = (
  config?: Pick<PaginateAdminCampaignUpdate, "query">,
) => {
  const query = ref<Required<PaginateAdminCampaignUpdate>["query"]>({
    page: config?.query?.page ?? 1,
    size: config?.query?.size ?? 15,
    search: config?.query?.search ?? "",
    campaign: config?.query?.campaign ?? "",
    campaignId: config?.query?.campaignId ?? "",
  })

  const key = computed(() => generateKey("GET", updateResource, "paginate", query.value))

  const run = (options?: QueryOptions<PaginateAdminCampaignUpdate["response"]>) =>
    useQuery<PaginateAdminCampaignUpdate["response"]>("/admin/updates", {
      key,
      query,
      ...options,
    })

  return { query, key, run }
}

/** The Kabar screen's primary view: one row per campaign, latest written first. */
export const getGroupAdminCampaignUpdate = (
  config?: Pick<GroupAdminCampaignUpdate, "query">,
) => {
  const query = ref<Required<GroupAdminCampaignUpdate>["query"]>({
    page: config?.query?.page ?? 1,
    size: config?.query?.size ?? 10,
    search: config?.query?.search ?? "",
    coverage: config?.query?.coverage ?? "",
  })

  const key = computed(() =>
    generateKey("GET", updateResource, "by-campaign", query.value),
  )

  const run = (options?: QueryOptions<GroupAdminCampaignUpdate["response"]>) =>
    useQuery<GroupAdminCampaignUpdate["response"]>("/admin/updates/by-campaign", {
      key,
      query,
      ...options,
    })

  return { query, key, run }
}

/** One kabar on its own, for the edit page. */
export const getDetailAdminCampaignUpdate = (
  config?: Pick<DetailAdminCampaignUpdate, "params">,
) => {
  const params = ref<DetailAdminCampaignUpdate["params"]>({
    id: config?.params?.id ?? "",
  })

  const key = computed(() =>
    generateKey("GET", updateResource, "detail", params.value.id),
  )

  const run = (options?: QueryOptions<DetailAdminCampaignUpdate["response"]>) =>
    useQuery<DetailAdminCampaignUpdate["response"]>(
      () => `/admin/updates/${params.value.id}`,
      { key, immediate: Boolean(params.value.id), ...options },
    )

  return { params, key, run }
}

/** The campaign header for `/admin/kabar/[id]`; needs only `update.view`. */
export const getDetailAdminUpdateCampaign = (
  config?: Pick<DetailAdminUpdateCampaign, "params">,
) => {
  const params = ref<DetailAdminUpdateCampaign["params"]>({
    id: config?.params?.id ?? "",
  })

  const key = computed(() =>
    generateKey("GET", updateResource, "campaign", params.value.id),
  )

  const run = (options?: QueryOptions<DetailAdminUpdateCampaign["response"]>) =>
    useQuery<DetailAdminUpdateCampaign["response"]>(
      () => `/admin/updates/campaign/${params.value.id}`,
      { key, immediate: Boolean(params.value.id), ...options },
    )

  return { params, key, run }
}

export const postAdminCampaignUpdate = () => {
  const body = ref<CreateAdminCampaignUpdate["body"]>({
    campaignId: "",
    title: "",
    description: "",
  })

  const run = (
    options?: MutationRunOptions<
      CreateAdminCampaignUpdate["response"],
      CreateAdminCampaignUpdate["body"]
    >,
  ) =>
    useMutation<CreateAdminCampaignUpdate["response"], CreateAdminCampaignUpdate["body"]>(
      "/admin/updates",
      { method: "POST", body, ...options },
    )

  return { body, validation: adminCampaignUpdateSchema, run }
}

export const putAdminCampaignUpdate = (
  config?: Pick<UpdateAdminCampaignUpdate, "params">,
) => {
  const params = ref<UpdateAdminCampaignUpdate["params"]>({
    id: config?.params?.id ?? "",
  })
  const body = ref<UpdateAdminCampaignUpdate["body"]>({
    campaignId: "",
    title: "",
    description: "",
  })

  const run = (
    options?: MutationRunOptions<
      UpdateAdminCampaignUpdate["response"],
      UpdateAdminCampaignUpdate["body"]
    >,
  ) =>
    useMutation<UpdateAdminCampaignUpdate["response"], UpdateAdminCampaignUpdate["body"]>(
      () => `/admin/updates/${params.value.id}`,
      { method: "PUT", body, ...options },
    )

  return { params, body, validation: adminCampaignUpdateSchema, run }
}

export const deleteAdminCampaignUpdate = (
  config?: Pick<DeleteAdminCampaignUpdate, "params">,
) => {
  const params = ref<DeleteAdminCampaignUpdate["params"]>({
    id: config?.params?.id ?? "",
  })

  const run = (
    options?: MutationRunOptions<DeleteAdminCampaignUpdate["response"], undefined>,
  ) =>
    useMutation<DeleteAdminCampaignUpdate["response"], undefined>(
      () => `/admin/updates/${params.value.id}`,
      { method: "DELETE", ...options },
    )

  return { params, run }
}
