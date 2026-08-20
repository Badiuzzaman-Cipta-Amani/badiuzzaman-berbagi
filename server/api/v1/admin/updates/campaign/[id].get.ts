/**
 * The campaign a kabar screen is about, with just enough to head the page.
 *
 * It lives under `/updates` on purpose: the guard maps this prefix to
 * `update.view`, so an editor whose role cannot open the campaign manager can
 * still see which program they are writing about.
 */
export default eventHandler(
  async (event): Promise<DetailAdminUpdateCampaign["response"]> => {
    const id = parseIdParam(event)

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        excerpt: true,
        campaignAttachments: {
          select: { name: true, path: true, mime: true, alt: true },
          orderBy: { sortOrder: "asc" },
        },
        updates: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        _count: { select: { updates: true } },
      },
    })

    if (!campaign) {
      throw createError({ status: 404, statusMessage: "Campaign tidak ditemukan" })
    }

    const media = campaign.campaignAttachments.map(serializeAttachment)

    return {
      message: "Success",
      data: {
        id: campaign.id.toString(),
        slug: campaign.slug,
        title: campaign.title,
        status: campaign.status,
        excerpt: campaign.excerpt,
        cover: media.find((item) => item.kind === "image") ?? null,
        totalUpdate: campaign._count.updates,
        lastPostedAt: campaign.updates[0]?.createdAt.toISOString() ?? null,
      },
    }
  },
)
