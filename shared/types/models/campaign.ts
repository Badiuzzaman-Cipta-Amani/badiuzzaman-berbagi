import type {
  Attachment,
  CampaignCategory,
  CampaignSortOption,
  CampaignStatus,
} from "../common"
import type { DataResponse, PaginationResponse } from "../response"
import type { DonationReceipt } from "./donation"

/**
 * Campaign as it crosses the wire: BigInt columns are narrowed to `number`
 * and dates to ISO strings, because JSON cannot carry either.
 */
export type CampaignListItem = {
  slug: string
  title: string
  category: CampaignCategory
  excerpt: string
  location: string | null
  status: CampaignStatus
  targetAmount: number
  raisedAmount: number
  /** 0-100, clamped. */
  progress: number
  /** Null when the campaign has no deadline. Negative once it has passed. */
  daysRemaining: number | null
  isUrgent: boolean
  totalDonor: number
  endAt: string | null
  createdAt: string
  cover: Attachment | null
}

export type CampaignDetail = CampaignListItem & {
  description: string
  mapsUrl: string | null
  verifiedAt: string | null
  media: Attachment[]
  fundraiser: {
    name: string
    description: string | null
    googleMaps: string | null
  } | null
}

export type PaginateCampaign = {
  query?: {
    search?: string
    page?: number
    size?: number
    sort?: CampaignSortOption
    category?: CampaignCategory | ""
  }
  response: PaginationResponse<CampaignListItem>
}

export type DetailCampaign = {
  params: { slug: string }
  response: DataResponse<CampaignDetail>
}

export type CriticalCampaign = {
  response: DataResponse<CampaignListItem | null>
}

/**
 * Donating returns the receipt rather than a bare message: the donor needs the
 * reference immediately — it is what they quote when they confirm the transfer,
 * and the only handle a donor without an account has on their own donation.
 *
 * A signed-in donor's `userId` is taken from the session, never from the body.
 */
export type DonateCampaign = {
  params: { slug: string }
  body: {
    /**
     * Every name the donation is given in, in the order they should be printed
     * on the certificate. The public display name is joined from this list
     * server-side, so a client never sends the two out of step.
     */
    donorNames: string[]
    message: string
    amount: number
  }
  response: DataResponse<DonationReceipt>
}
