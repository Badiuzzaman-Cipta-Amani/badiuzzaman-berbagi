export default eventHandler(async (event): Promise<DetailCampaign["response"]> => {
  const slug = getRouterParam(event, "slug")

  if (!slug) {
    throw createError({ status: 400, statusMessage: "Campaign slug is required" })
  }

  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: campaignDetailSelect,
  })

  if (!campaign) {
    throw createError({ status: 404, statusMessage: "Campaign not found" })
  }

  return {
    message: "Success",
    data: serializeCampaignDetail(campaign),
  }
})
