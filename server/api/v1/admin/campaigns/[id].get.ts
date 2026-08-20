export default eventHandler(async (event): Promise<DetailAdminCampaign["response"]> => {
  const id = parseIdParam(event)

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: adminCampaignDetailSelect,
  })

  if (!campaign) {
    throw createError({ status: 404, statusMessage: "Campaign tidak ditemukan" })
  }

  const pending = await countPendingDonations([campaign.id])

  return {
    message: "Success",
    data: serializeAdminCampaignDetail(
      campaign,
      pending.get(campaign.id.toString()) ?? 0,
    ),
  }
})
