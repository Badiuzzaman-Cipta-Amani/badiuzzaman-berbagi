import type { Prisma } from "~~/prisma/generated/client"

/**
 * Kabar, grouped by campaign and ordered by when each campaign was last written
 * about. That ordering is the point of the screen: the admin has to see what
 * they already published for a program before adding to it.
 *
 * Prisma cannot `orderBy` the maximum of a relation's column, so the ranking is
 * built from a `groupBy` and applied in memory — the same escape hatch
 * `campaigns/index.get.ts` uses for `almost_reach`. Campaign counts here are in
 * the hundreds, not the millions, so a full id scan is cheap; the expensive
 * part, loading updates and cover art, still only happens for one page.
 */

const UPDATES_PER_CAMPAIGN = 3

export default eventHandler(
  async (event): Promise<GroupAdminCampaignUpdate["response"]> => {
    const query = getQuery(event)

    const page = normalizePage(query.page)
    const size = normalizeSize(query.size)
    const search = String(query.search ?? "").trim()
    const coverage = String(query.coverage ?? "")

    const where: Prisma.CampaignWhereInput = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { updates: { some: { title: { contains: search, mode: "insensitive" } } } },
      ]
    }

    if (coverage === "posted") where.updates = { some: {} }
    if (coverage === "empty") where.updates = { none: {} }

    const [candidates, lastPosts] = await Promise.all([
      prisma.campaign.findMany({ where, select: { id: true, createdAt: true } }),
      prisma.campaignUpdate.groupBy({
        by: ["campaignId"],
        _max: { createdAt: true },
      }),
    ])

    const lastPostedAt = new Map(
      lastPosts.map((row) => [row.campaignId.toString(), row._max.createdAt]),
    )

    const ranked = candidates.sort((a, b) => {
      const left = lastPostedAt.get(a.id.toString())
      const right = lastPostedAt.get(b.id.toString())

      // A campaign nobody has written about yet sorts below every one that has
      // a post — but above nothing, so it stays reachable at the end of the list.
      if (left && right) return right.getTime() - left.getTime()
      if (left) return -1
      if (right) return 1
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    const pageIds = ranked.slice((page - 1) * size, page * size).map((row) => row.id)

    const campaigns = pageIds.length
      ? await prisma.campaign.findMany({
          where: { id: { in: pageIds } },
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            campaignAttachments: {
              select: { name: true, path: true, mime: true, alt: true },
              orderBy: { sortOrder: "asc" },
            },
            updates: {
              orderBy: { createdAt: "desc" },
              take: UPDATES_PER_CAMPAIGN,
              select: adminUpdateSelect,
            },
            _count: { select: { updates: true } },
          },
        })
      : []

    // `findMany` with `in` ignores the order of the list, so restore the ranking.
    const order = new Map(pageIds.map((id, index) => [id.toString(), index]))
    campaigns.sort(
      (a, b) => (order.get(a.id.toString()) ?? 0) - (order.get(b.id.toString()) ?? 0),
    )

    return {
      message: "Success",
      data: campaigns.map((campaign) => {
        const media = campaign.campaignAttachments.map(serializeAttachment)
        const posted = lastPostedAt.get(campaign.id.toString())

        return {
          campaign: {
            id: campaign.id.toString(),
            slug: campaign.slug,
            title: campaign.title,
            status: campaign.status,
            cover: media.find((item) => item.kind === "image") ?? null,
          },
          totalUpdate: campaign._count.updates,
          lastPostedAt: posted?.toISOString() ?? null,
          updates: campaign.updates.map(serializeAdminCampaignUpdate),
        }
      }),
      meta: buildPaginationMeta(page, size, ranked.length),
    }
  },
)
