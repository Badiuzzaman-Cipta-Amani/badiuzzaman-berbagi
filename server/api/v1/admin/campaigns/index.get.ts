import type { Prisma } from "~~/prisma/generated/client"

import { CampaignCategory, CampaignStatus } from "~~/prisma/generated/enums"

/** Enum-valued filters must be own keys of the generated enum or Prisma rejects the query. */
function parseEnum<T extends Record<string, string>>(
  source: T,
  value: unknown,
): T[keyof T] | undefined {
  const candidate = String(value ?? "")
  return Object.hasOwn(source, candidate) ? (candidate as T[keyof T]) : undefined
}

function parseOrderBy(sort: unknown): Prisma.CampaignOrderByWithRelationInput | null {
  switch (String(sort ?? "")) {
    case "oldest":
      return { createdAt: "asc" }
    case "highest_raised":
      return { raisedAmount: "desc" }
    case "almost_reach":
      return null
    default:
      return { createdAt: "desc" }
  }
}

export default eventHandler(async (event): Promise<PaginateAdminCampaign["response"]> => {
  const query = getQuery(event)

  const page = normalizePage(query.page)
  const size = normalizeSize(query.size)
  const search = String(query.search ?? "").trim()
  const status = parseEnum(CampaignStatus, query.status)
  const category = parseEnum(CampaignCategory, query.category)
  const orderBy = parseOrderBy(query.sort)

  // Unlike the public list, no implicit `status: active` — the back office is
  // where drafts and cancelled campaigns have to be visible.
  const where: Prisma.CampaignWhereInput = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ]
  }

  if (status) where.status = status
  if (category) where.category = category

  // `almost_reach` ranks by raised/target ratio, which Prisma cannot order by.
  if (!orderBy) {
    const rows = await prisma.campaign.findMany({ where, select: adminCampaignSelect })
    const pending = await countPendingDonations(rows.map((row) => row.id))

    const sorted = rows
      .map((row) => serializeAdminCampaign(row, pending.get(row.id.toString()) ?? 0))
      .sort((a, b) => b.progress - a.progress || b.raisedAmount - a.raisedAmount)

    return {
      message: "Success",
      data: sorted.slice((page - 1) * size, page * size),
      meta: buildPaginationMeta(page, size, sorted.length),
    }
  }

  const [rows, meta] = await prisma.campaign
    .paginate({ where, orderBy, select: adminCampaignSelect })
    .withPages({ page, limit: size, includePageCount: true })

  const pending = await countPendingDonations(rows.map((row) => row.id))

  return {
    message: "Success",
    data: rows.map((row) =>
      serializeAdminCampaign(row, pending.get(row.id.toString()) ?? 0),
    ),
    meta,
  }
})
