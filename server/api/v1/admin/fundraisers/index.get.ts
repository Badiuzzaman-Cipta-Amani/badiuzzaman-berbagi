import type { Prisma } from "~~/prisma/generated/client"

export default eventHandler(
  async (event): Promise<PaginateAdminFundraiser["response"]> => {
    const query = getQuery(event)

    const page = normalizePage(query.page)
    const size = normalizeSize(query.size)
    const search = String(query.search ?? "").trim()

    const where: Prisma.FundraiserWhereInput = search
      ? { name: { contains: search, mode: "insensitive" } }
      : {}

    const [rows, meta] = await prisma.fundraiser
      .paginate({ where, orderBy: { name: "asc" }, select: adminFundraiserSelect })
      .withPages({ page, limit: size, includePageCount: true })

    return { message: "Success", data: rows.map(serializeAdminFundraiser), meta }
  },
)
