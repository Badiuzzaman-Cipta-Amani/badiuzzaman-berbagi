import type { Attachment, CampaignStatus } from "../../common"
import type { DataResponse, MessageResponse, PaginationResponse } from "../../response"

/** Fundraisers — the organizations a campaign is attributed to. */
export type AdminFundraiserItem = {
  id: string
  name: string
  description: string | null
  googleMaps: string | null
  totalCampaign: number
  /** Verified funds across every campaign this fundraiser owns. */
  totalRaised: number
  createdAt: string
}

export type PaginateAdminFundraiser = {
  query?: { search?: string; page?: number; size?: number }
  response: PaginationResponse<AdminFundraiserItem>
}

/** Used by the campaign form's fundraiser picker, which needs all of them at once. */
export type ListAdminFundraiser = {
  response: DataResponse<{ id: string; name: string }[]>
}

export type AdminFundraiserBody = {
  name: string
  googleMaps?: string
  description?: string
}

export type CreateAdminFundraiser = {
  body: AdminFundraiserBody
  response: DataResponse<AdminFundraiserItem>
}

export type UpdateAdminFundraiser = {
  params: { id: string }
  body: AdminFundraiserBody
  response: DataResponse<AdminFundraiserItem>
}

export type DeleteAdminFundraiser = {
  params: { id: string }
  response: MessageResponse
}

/** Campaign updates — the progress posts shown on the public detail page. */
export type AdminCampaignUpdateItem = {
  id: string
  title: string
  description: string
  createdAt: string
  campaign: { id: string; slug: string; title: string } | null
}

export type PaginateAdminCampaignUpdate = {
  query?: {
    search?: string
    page?: number
    size?: number
    /** By campaign **slug** — used by the public-facing filter. */
    campaign?: string
    /**
     * By campaign **id**. The kabar screens address campaigns by id, the same
     * way the rest of the back office does, because a slug is editable and so
     * cannot be the handle a management URL is built from.
     */
    campaignId?: string
  }
  response: PaginationResponse<AdminCampaignUpdateItem>
}

/** One update on its own, for the edit page. */
export type DetailAdminCampaignUpdate = {
  params: { id: string }
  response: DataResponse<AdminCampaignUpdateItem>
}

/**
 * The campaign header on `/admin/kabar/[id]`. It lives under `/updates` rather
 * than reusing `admin/campaigns/[id]` so that writing kabar needs only
 * `update.view` — an editor who may not open the campaign manager can still see
 * which program they are writing about.
 */
export type AdminUpdateCampaign = {
  id: string
  slug: string
  title: string
  status: CampaignStatus
  excerpt: string
  cover: Attachment | null
  totalUpdate: number
  lastPostedAt: string | null
}

export type DetailAdminUpdateCampaign = {
  params: { id: string }
  response: DataResponse<AdminUpdateCampaign>
}

/**
 * The Kabar screen is organised by campaign rather than by post: an admin
 * writing an update needs to see what they last said about *this* program
 * before adding to it. One row per campaign, carrying its most recent posts.
 */
export type AdminCampaignUpdateGroup = {
  campaign: {
    id: string
    slug: string
    title: string
    status: CampaignStatus
    cover: Attachment | null
  }
  totalUpdate: number
  /** ISO date of the newest post, or `null` when the campaign has none yet. */
  lastPostedAt: string | null
  /** Newest first, capped — the full history lives behind "lihat semua". */
  updates: AdminCampaignUpdateItem[]
}

export type GroupAdminCampaignUpdate = {
  query?: {
    search?: string
    page?: number
    size?: number
    /** `posted` hides campaigns with no kabar; `empty` shows only those. */
    coverage?: "posted" | "empty" | ""
  }
  response: PaginationResponse<AdminCampaignUpdateGroup>
}

export type AdminCampaignUpdateBody = {
  campaignId: string
  title: string
  description: string
}

export type CreateAdminCampaignUpdate = {
  body: AdminCampaignUpdateBody
  response: DataResponse<AdminCampaignUpdateItem>
}

export type UpdateAdminCampaignUpdate = {
  params: { id: string }
  body: AdminCampaignUpdateBody
  response: DataResponse<AdminCampaignUpdateItem>
}

export type DeleteAdminCampaignUpdate = {
  params: { id: string }
  response: MessageResponse
}
