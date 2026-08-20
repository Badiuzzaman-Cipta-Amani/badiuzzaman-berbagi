import { CAMPAIGN_URGENT_DAYS } from "~~/shared/constants/campaign"

/**
 * The single most pressing active campaign: the one whose deadline lands
 * soonest inside the urgency window.
 */
export default eventHandler(async (): Promise<CriticalCampaign["response"]> => {
  const now = new Date()
  const deadline = new Date(now.getTime() + CAMPAIGN_URGENT_DAYS * 24 * 60 * 60 * 1000)

  const campaign = await prisma.campaign.findFirst({
    where: {
      status: "active",
      endAt: { gte: now, lte: deadline },
    },
    orderBy: { endAt: "asc" },
    select: campaignListSelect,
  })

  return {
    message: "Success",
    data: campaign ? serializeCampaign(campaign) : null,
  }
})
