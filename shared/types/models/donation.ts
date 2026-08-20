import type { Attachment, DonationStatus } from "../common"
import type { DataResponse, PaginationResponse } from "../response"

/**
 * A donation as its own donor reads it. This is the receipt half of the
 * verification loop: the donor confirms they transferred, an admin matches it
 * against the bank statement, and the status here is what the donor watches.
 *
 * It is addressed by `reference`, never by `id` — a donor without an account
 * still has to be able to look their donation up, and a sequential id would let
 * anyone walk the whole table.
 */
export type DonationReceipt = {
  reference: string
  /** The roster joined for display; `donorNames` is what the certificate lists. */
  donorName: string
  /** Never empty — a donation given in one name is a roster of one. */
  donorNames: string[]
  amount: number
  message: string | null
  status: DonationStatus
  createdAt: string
  /** When the donor sent proof of transfer; `null` while the donor still owes it. */
  confirmedAt: string | null
  verifiedAt: string | null
  /** Why an admin rejected it, shown to the donor so a fixable mistake is fixable. */
  reviewNote: string | null
  proofUrl: string | null
  proofNote: string | null
  campaign: { slug: string; title: string; cover: Attachment | null } | null
}

/** Public status lookup — the donor quotes the reference, no account needed. */
export type TrackDonation = {
  params: { reference: string }
  response: DataResponse<DonationReceipt>
}

/**
 * The donor's half of verification. It records proof and stamps `confirmedAt`;
 * it deliberately does **not** move `status`, because only an admin may do that.
 */
export type ConfirmDonation = {
  params: { reference: string }
  body: { proofUrl: string; proofNote?: string }
  response: DataResponse<DonationReceipt>
}

export type PaginateMyDonation = {
  query?: { page?: number; size?: number; status?: DonationStatus | "" }
  response: PaginationResponse<DonationReceipt>
}
