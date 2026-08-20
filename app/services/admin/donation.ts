import type { MutationRunOptions, QueryOptions } from "~/types/fetch"

import { adminDonationVerifySchema } from "~~/shared/validation/admin"

import { generateKey } from "~/utils/api"

const resource = "admin/donations"

export const getPaginateAdminDonation = (
  config?: Pick<PaginateAdminDonation, "query">,
) => {
  const query = ref<Required<PaginateAdminDonation>["query"]>({
    page: config?.query?.page ?? 1,
    size: config?.query?.size ?? 15,
    search: config?.query?.search ?? "",
    status: config?.query?.status ?? "",
    campaign: config?.query?.campaign ?? "",
    sort: config?.query?.sort ?? "latest",
  })

  const key = computed(() => generateKey("GET", resource, "paginate", query.value))

  const run = (options?: QueryOptions<PaginateAdminDonation["response"]>) =>
    useQuery<PaginateAdminDonation["response"]>("/admin/donations", {
      key,
      query,
      ...options,
    })

  return { query, key, run }
}

export const getDetailAdminDonation = (config?: Pick<DetailAdminDonation, "params">) => {
  const params = ref<DetailAdminDonation["params"]>({ id: config?.params?.id ?? "" })

  const key = computed(() => generateKey("GET", resource, "detail", params.value.id))

  const run = (options?: QueryOptions<DetailAdminDonation["response"]>) =>
    useQuery<DetailAdminDonation["response"]>(
      () => `/admin/donations/${params.value.id}`,
      { key, immediate: Boolean(params.value.id), ...options },
    )

  return { params, key, run }
}

/** The only write the donation screens expose — verify or reject, with a note. */
export const postVerifyAdminDonation = (config?: Pick<VerifyAdminDonation, "params">) => {
  const params = ref<VerifyAdminDonation["params"]>({ id: config?.params?.id ?? "" })
  const body = ref<VerifyAdminDonation["body"]>({ status: "verified", reviewNote: "" })

  const run = (
    options?: MutationRunOptions<
      VerifyAdminDonation["response"],
      VerifyAdminDonation["body"]
    >,
  ) =>
    useMutation<VerifyAdminDonation["response"], VerifyAdminDonation["body"]>(
      () => `/admin/donations/${params.value.id}/verify`,
      { method: "POST", body, ...options },
    )

  return { params, body, validation: adminDonationVerifySchema, run }
}
