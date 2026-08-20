import type { Prisma } from "~~/prisma/generated/client"

export const updateSelect = {
  id: true,
  title: true,
  description: true,
  createdAt: true,
  campaign: {
    select: {
      slug: true,
      title: true,
      raisedAmount: true,
      targetAmount: true,
      campaignAttachments: {
        select: { name: true, path: true, mime: true, alt: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  },
} satisfies Prisma.CampaignUpdateSelect

type UpdateRow = Prisma.CampaignUpdateGetPayload<{ select: typeof updateSelect }>

export function serializeUpdate(update: UpdateRow): UpdateItem {
  const campaign = update.campaign

  return {
    id: update.id.toString(),
    title: update.title,
    description: update.description,
    createdAt: update.createdAt.toISOString(),
    campaign: campaign
      ? {
          slug: campaign.slug,
          title: campaign.title,
          progress: campaignProgress(campaign.raisedAmount, campaign.targetAmount),
          cover:
            campaign.campaignAttachments
              .map(serializeAttachment)
              .find((item) => item.kind === "image") ?? null,
        }
      : null,
  }
}
