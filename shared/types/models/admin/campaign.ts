import type { Attachment, CampaignCategory, CampaignStatus } from "../../common"
import type { DataResponse, MessageResponse, PaginationResponse } from "../../response"

/**
 * The admin campaign row carries `id` and the draft/cancelled states the public
 * list filters out, plus the pending-donation count that drives the queue badge.
 */
export type AdminCampaignItem = {
  id: string
  slug: string
  title: string
  category: CampaignCategory
  status: CampaignStatus
  location: string | null
  targetAmount: number
  raisedAmount: number
  progress: number
  totalDonor: number
  pendingDonation: number
  endAt: string | null
  verifiedAt: string | null
  createdAt: string
  cover: Attachment | null
  fundraiser: { id: string; name: string } | null
}

export type AdminCampaignDetail = AdminCampaignItem & {
  excerpt: string
  description: string
  mapsUrl: string | null
  media: Attachment[]
}

/**
 * What the campaign form sends. `images` are absolute URLs — there is no upload
 * pipeline yet, so artwork is referenced rather than stored.
 */
export type AdminCampaignBody = {
  title: string
  slug?: string
  category: CampaignCategory
  excerpt: string
  description: string
  location?: string
  mapsUrl?: string
  targetAmount: number
  status: CampaignStatus
  endAt?: string | null
  fundraiserId?: string | null
  images?: string[]
}

export type PaginateAdminCampaign = {
  query?: {
    search?: string
    page?: number
    size?: number
    status?: CampaignStatus | ""
    category?: CampaignCategory | ""
    sort?: "latest" | "oldest" | "highest_raised" | "almost_reach"
  }
  response: PaginationResponse<AdminCampaignItem>
}

export type DetailAdminCampaign = {
  params: { id: string }
  response: DataResponse<AdminCampaignDetail>
}

export type CreateAdminCampaign = {
  body: AdminCampaignBody
  response: DataResponse<AdminCampaignDetail>
}

export type UpdateAdminCampaign = {
  params: { id: string }
  body: AdminCampaignBody
  response: DataResponse<AdminCampaignDetail>
}

export type DeleteAdminCampaign = {
  params: { id: string }
  response: MessageResponse
}
