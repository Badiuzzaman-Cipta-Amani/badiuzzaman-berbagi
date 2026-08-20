import type { CAMPAIGN_SORT_OPTIONS } from "../constants/campaign"
import type {
  CampaignCategory,
  CampaignStatus,
  DonationStatus,
} from "~~/prisma/generated/enums"

export type { CampaignCategory, CampaignStatus, DonationStatus }

export type CampaignSortOption = (typeof CAMPAIGN_SORT_OPTIONS)[number]

export type AttachmentKind = "image" | "video" | "file"

export type Attachment = {
  name: string
  path: string
  mime: string
  alt: string | null
  kind: AttachmentKind
  /** Ready-to-render source, already joined from path + name. */
  url: string
}
