import type { Prisma } from "~~/prisma/generated/client"

import { CampaignCategory } from "~~/prisma/generated/enums"
import { CAMPAIGN_SORT_OPTIONS } from "~~/shared/constants/campaign"

/**
 * `category` reaches Prisma as a raw enum value, so anything that is not an own
 * key of the generated enum has to be dropped here — a stale or invented value
 * makes the query engine reject the whole `findMany`.
 */
function parseCategory(value: unknown): CampaignCategory | undefined {
  const category = String(value ?? "")
  return Object.hasOwn(CampaignCategory, category)
    ? (category as CampaignCategory)
    : undefined
}

function parseSort(value: unknown): CampaignSortOption {
  const sort = String(value ?? "").toLowerCase()
  return (CAMPAIGN_SORT_OPTIONS as readonly string[]).includes(sort)
    ? (sort as CampaignSortOption)
    : "latest"
}

/**
 * `almost_reach` ranks by raised/target ratio, which SQL cannot express through
 * Prisma's `orderBy`. Every other sort maps straight onto the database.
 */
function parseOrderBy(
  sort: CampaignSortOption,
): Prisma.CampaignOrderByWithRelationInput | null {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" }
    case "urgent":
      return { endAt: { sort: "asc", nulls: "last" } }
    case "popular":
      return { donations: { _count: "desc" } }
    case "highest_nominal":
      return { targetAmount: "desc" }
    case "almost_reach":
      return null
    case "latest":
    default:
      return { createdAt: "desc" }
  }
}

export default eventHandler(async (event): Promise<PaginateCampaign["response"]> => {
  const query = getQuery(event)

  const page = normalizePage(query.page)
  const size = normalizeSize(query.size)
  const search = String(query.search ?? "").trim()
  const category = parseCategory(query.category)
  const orderBy = parseOrderBy(parseSort(query.sort))

  const where: Prisma.CampaignWhereInput = { status: "active" }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ]
  }

  if (category) where.category = category

  // The one sort the database cannot order by has to page in memory.
  if (!orderBy) {
    const rows = await prisma.campaign.findMany({ where, select: campaignListSelect })
    const sorted = rows
      .map(serializeCampaign)
      .sort((a, b) => b.progress - a.progress || b.raisedAmount - a.raisedAmount)

    return {
      message: "Success",
      data: sorted.slice((page - 1) * size, page * size),
      meta: buildPaginationMeta(page, size, sorted.length),
    }
  }

  const [rows, meta] = await prisma.campaign
    .paginate({ where, orderBy, select: campaignListSelect })
    .withPages({ page, limit: size, includePageCount: true })

  return { message: "Success", data: rows.map(serializeCampaign), meta }
})
