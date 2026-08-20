export default eventHandler(async (event): Promise<PaginateCampaignDua["response"]> => {
  const slug = getRouterParam(event, "slug")
  const query = getQuery(event)

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

  const [duas, meta] = await prisma.donation
    .paginate({
      where: { ...duaWhere, campaignId: campaign.id },
      orderBy: { createdAt: "desc" },
      select: duaSelect,
    })
    .withPages({
      page: normalizePage(query.page),
      limit: normalizeSize(query.size),
      includePageCount: true,
    })

  return {
    message: "Success",
    data: duas.map(serializeDua),
    meta,
  }
})
