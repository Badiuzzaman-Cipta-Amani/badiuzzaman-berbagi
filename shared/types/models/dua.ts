import type { DonationStatus } from "../common"
import type { DataResponse, PaginationResponse } from "../response"

/**
 * A dua is the prayer/message a donor leaves alongside a donation.
 * `id` is a string because the underlying column is a BigInt.
 */
export type DuaItem = {
  id: string
  donorName: string
  message: string
  amount: number
  status: DonationStatus
  createdAt: string
  campaign: { slug: string; title: string } | null
}

export type ListDua = {
  query?: { size?: number }
  response: DataResponse<DuaItem[]>
}

export type PaginateCampaignDua = {
  params: { slug: string }
  query?: {
    page?: number
    size?: number
  }
  response: PaginationResponse<DuaItem>
}
