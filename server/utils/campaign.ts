import type { Prisma } from "~~/prisma/generated/client"

import { CAMPAIGN_URGENT_DAYS } from "~~/shared/constants/campaign"

/**
 * The shape every campaign payload is read in, plus the serializers that turn it
 * into the wire DTO. Handlers own their own `where`/`orderBy`/pagination; only
 * the parts more than one endpoint needs live here.
 */

/** Columns every campaign payload needs, plus the donor count and cover art. */
export const campaignListSelect = {
  slug: true,
  title: true,
  category: true,
  excerpt: true,
  location: true,
  status: true,
  targetAmount: true,
  raisedAmount: true,
  endAt: true,
  createdAt: true,
  campaignAttachments: {
    select: { name: true, path: true, mime: true, alt: true },
    orderBy: { sortOrder: "asc" },
  },
  _count: { select: { donations: true } },
} satisfies Prisma.CampaignSelect

export const campaignDetailSelect = {
  ...campaignListSelect,
  description: true,
  mapsUrl: true,
  verifiedAt: true,
  fundraiser: { select: { name: true, description: true, googleMaps: true } },
} satisfies Prisma.CampaignSelect

type AttachmentRow = { name: string; path: string; mime: string; alt: string | null }

function attachmentKind(mime: string): AttachmentKind {
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  return "file"
}

/** `path` is a directory prefix, `name` the file — join them without doubling slashes. */
function attachmentUrl(path: string, name: string) {
  if (!name) return path
  return `${path.replace(/\/+$/, "")}/${name.replace(/^\/+/, "")}`
}

export function serializeAttachment(attachment: AttachmentRow): Attachment {
  return {
    name: attachment.name,
    path: attachment.path,
    mime: attachment.mime,
    alt: attachment.alt,
    kind: attachmentKind(attachment.mime),
    url: attachmentUrl(attachment.path, attachment.name),
  }
}

export function campaignProgress(
  raisedAmount: bigint | number,
  targetAmount: bigint | number,
) {
  const target = Number(targetAmount)
  if (target <= 0) return 0
  return Math.min(100, Math.round((Number(raisedAmount) / target) * 100))
}

/** Whole days until `endAt`; negative once the deadline has passed. */
export function campaignDaysRemaining(endAt: Date | null) {
  if (!endAt) return null
  const diff = endAt.getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

type CampaignListRow = Prisma.CampaignGetPayload<{ select: typeof campaignListSelect }>
type CampaignDetailRow = Prisma.CampaignGetPayload<{
  select: typeof campaignDetailSelect
}>

export function serializeCampaign(campaign: CampaignListRow): CampaignListItem {
  const daysRemaining = campaignDaysRemaining(campaign.endAt)
  const media = campaign.campaignAttachments.map(serializeAttachment)

  return {
    slug: campaign.slug,
    title: campaign.title,
    category: campaign.category,
    excerpt: campaign.excerpt,
    location: campaign.location,
    status: campaign.status,
    targetAmount: Number(campaign.targetAmount),
    raisedAmount: Number(campaign.raisedAmount),
    progress: campaignProgress(campaign.raisedAmount, campaign.targetAmount),
    daysRemaining,
    isUrgent:
      daysRemaining !== null &&
      daysRemaining >= 0 &&
      daysRemaining <= CAMPAIGN_URGENT_DAYS,
    totalDonor: campaign._count.donations,
    endAt: campaign.endAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    cover: media.find((item) => item.kind === "image") ?? null,
  }
}

export function serializeCampaignDetail(campaign: CampaignDetailRow): CampaignDetail {
  return {
    ...serializeCampaign(campaign),
    description: campaign.description,
    mapsUrl: campaign.mapsUrl,
    verifiedAt: campaign.verifiedAt?.toISOString() ?? null,
    media: campaign.campaignAttachments.map(serializeAttachment),
    fundraiser: campaign.fundraiser,
  }
}
