import type { Prisma } from "~~/prisma/generated/client"

export default eventHandler(
  async (event): Promise<PaginateAdminCampaignUpdate["response"]> => {
    const query = getQuery(event)

    const page = normalizePage(query.page)
    const size = normalizeSize(query.size)
    const search = String(query.search ?? "").trim()
    const campaign = String(query.campaign ?? "").trim()
    const campaignId = String(query.campaignId ?? "").trim()

    const where: Prisma.CampaignUpdateWhereInput = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (campaign) where.campaign = { slug: campaign }

    // Non-numeric ids would blow up `BigInt()`, so they simply do not filter.
    if (/^\d+$/.test(campaignId)) where.campaignId = BigInt(campaignId)

    const [rows, meta] = await prisma.campaignUpdate
      .paginate({ where, orderBy: { createdAt: "desc" }, select: adminUpdateSelect })
      .withPages({ page, limit: size, includePageCount: true })

    return { message: "Success", data: rows.map(serializeAdminCampaignUpdate), meta }
  },
)
