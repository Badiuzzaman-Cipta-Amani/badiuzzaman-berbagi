import type { MutationRunOptions, QueryOptions } from "~/types/fetch"

import { confirmDonationSchema } from "~~/shared/validation/donation"

import { generateKey } from "~/utils/api"

const resource = "donations"

/** Status lookup by the code the donor was given — no account required. */
export const getTrackDonation = (config?: Pick<TrackDonation, "params">) => {
  const params = ref<TrackDonation["params"]>({
    reference: config?.params?.reference ?? "",
  })

  const key = computed(() =>
    generateKey("GET", resource, "track", params.value.reference),
  )

  const run = (options?: QueryOptions<TrackDonation["response"]>) =>
    useQuery<TrackDonation["response"]>(() => `/donations/${params.value.reference}`, {
      key,
      immediate: Boolean(params.value.reference),
      ...options,
    })

  return { params, key, run }
}

export const postConfirmDonation = (config?: Pick<ConfirmDonation, "params">) => {
  const params = ref<ConfirmDonation["params"]>({
    reference: config?.params?.reference ?? "",
  })
  const body = ref<ConfirmDonation["body"]>({ proofUrl: "", proofNote: "" })

  const run = (
    options?: MutationRunOptions<ConfirmDonation["response"], ConfirmDonation["body"]>,
  ) =>
    useMutation<ConfirmDonation["response"], ConfirmDonation["body"]>(
      () => `/donations/${params.value.reference}/confirm`,
      { method: "POST", body, ...options },
    )

  return { params, body, validation: confirmDonationSchema, run }
}

/** The signed-in donor's own history. */
export const getPaginateMyDonation = (config?: Pick<PaginateMyDonation, "query">) => {
  const query = ref<Required<PaginateMyDonation>["query"]>({
    page: config?.query?.page ?? 1,
    size: config?.query?.size ?? 10,
    status: config?.query?.status ?? "",
  })

  const key = computed(() => generateKey("GET", "me/donations", "paginate", query.value))

  const run = (options?: QueryOptions<PaginateMyDonation["response"]>) =>
    useQuery<PaginateMyDonation["response"]>("/me/donations", {
      key,
      query,
      ...options,
    })

  return { query, key, run }
}
