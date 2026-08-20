import type { DonationStatus } from "../../common"
import type { DataResponse, MessageResponse, PaginationResponse } from "../../response"

/**
 * A donation as the back office reads it: everything the public dua feed hides,
 * plus the audit trail of who moved it out of `pending`.
 */
export type AdminDonationItem = {
  id: string
  /** The code the donor quotes; the handle for the public status lookup. */
  reference: string
  /** The roster joined for display; `donorNames` is what the certificate lists. */
  donorName: string
  /** Never empty — a donation given in one name is a roster of one. */
  donorNames: string[]
  amount: number
  message: string | null
  status: DonationStatus
  isDuaHidden: boolean
  reviewNote: string | null
  createdAt: string
  verifiedAt: string | null
  /** What the donor sent back as proof of transfer, and when they sent it. */
  proofUrl: string | null
  proofNote: string | null
  confirmedAt: string | null
  /**
   * Carries `id` as well as `slug` because the back office addresses campaigns
   * by id — the donation list links its campaign column at the admin page, not
   * the public one.
   */
  campaign: { id: string; slug: string; title: string } | null
  user: { id: string; name: string; email: string } | null
  verifiedBy: { id: string; name: string } | null
}

export type AdminDonationDetail = AdminDonationItem & {
  campaign: {
    id: string
    slug: string
    title: string
    targetAmount: number
    raisedAmount: number
    progress: number
  } | null
}

export type PaginateAdminDonation = {
  query?: {
    search?: string
    page?: number
    size?: number
    status?: DonationStatus | ""
    campaign?: string
    sort?: "latest" | "oldest" | "highest" | "lowest"
  }
  response: PaginationResponse<AdminDonationItem>
}

export type DetailAdminDonation = {
  params: { id: string }
  response: DataResponse<AdminDonationDetail>
}

/**
 * The only write the donation screens allow. Moving to `verified` adds the
 * amount to `Campaign.raisedAmount`; moving away from it subtracts again.
 */
export type VerifyAdminDonation = {
  params: { id: string }
  body: { status: Extract<DonationStatus, "verified" | "rejected">; reviewNote?: string }
  response: DataResponse<AdminDonationDetail>
}

export type AdminDuaItem = {
  id: string
  donorName: string
  message: string
  amount: number
  status: DonationStatus
  isDuaHidden: boolean
  createdAt: string
  campaign: { slug: string; title: string } | null
}

export type PaginateAdminDua = {
  query?: {
    search?: string
    page?: number
    size?: number
    visibility?: "visible" | "hidden" | ""
  }
  response: PaginationResponse<AdminDuaItem>
}

export type ToggleAdminDua = {
  params: { id: string }
  body: { isDuaHidden: boolean }
  response: MessageResponse
}
