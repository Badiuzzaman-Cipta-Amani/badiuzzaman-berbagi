import type { Prisma } from "~~/prisma/generated/client"

/**
 * The moderation view of the public dua feed. Unlike `duas/index.get.ts` it also
 * lists what is already hidden, so a decision can be reversed.
 */
export default eventHandler(async (event): Promise<PaginateAdminDua["response"]> => {
  const query = getQuery(event)

  const page = normalizePage(query.page)
  const size = normalizeSize(query.size)
  const search = String(query.search ?? "").trim()
  const visibility = String(query.visibility ?? "")

  const where: Prisma.DonationWhereInput = { message: { not: null } }

  if (search) {
    where.OR = [
      { message: { contains: search, mode: "insensitive" } },
      { donorName: { contains: search, mode: "insensitive" } },
    ]
  }

  if (visibility === "hidden") where.isDuaHidden = true
  if (visibility === "visible") where.isDuaHidden = false

  const [rows, meta] = await prisma.donation
    .paginate({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        donorName: true,
        message: true,
        amount: true,
        status: true,
        isDuaHidden: true,
        createdAt: true,
        campaign: { select: { slug: true, title: true } },
      },
    })
    .withPages({ page, limit: size, includePageCount: true })

  return {
    message: "Success",
    data: rows.map((row) => ({
      id: row.id.toString(),
      donorName: row.donorName || "Hamba Allah",
      message: row.message ?? "",
      amount: Number(row.amount),
      status: row.status,
      isDuaHidden: row.isDuaHidden,
      createdAt: row.createdAt.toISOString(),
      campaign: row.campaign,
    })),
    meta,
  }
})
