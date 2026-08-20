export default eventHandler(async (event): Promise<ListCampaignUpdate["response"]> => {
  const slug = getRouterParam(event, "slug")

  if (!slug) {
    throw createError({ status: 400, statusMessage: "Campaign slug is required" })
  }

  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!campaign) {
    throw createError({ status: 404, statusMessage: "Campaign not found" })
  }

  const updates = await prisma.campaignUpdate.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    select: updateSelect,
  })

  return {
    message: "Success",
    data: updates.map(serializeUpdate),
  }
})
