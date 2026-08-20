import type { Prisma } from "~~/prisma/generated/client"

function parseOrderBy(sort: unknown): Prisma.UserOrderByWithRelationInput {
  switch (String(sort ?? "")) {
    case "oldest":
      return { createdAt: "asc" }
    case "name":
      return { name: "asc" }
    case "highest_donation":
      return { donations: { _count: "desc" } }
    default:
      return { createdAt: "desc" }
  }
}

export default eventHandler(async (event): Promise<PaginateAdminUser["response"]> => {
  const query = getQuery(event)

  const page = normalizePage(query.page)
  const size = normalizeSize(query.size)
  const search = String(query.search ?? "").trim()

  const where: Prisma.UserWhereInput = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ]
  }

  const [rows, meta] = await prisma.user
    .paginate({ where, orderBy: parseOrderBy(query.sort), select: adminUserSelect })
    .withPages({ page, limit: size, includePageCount: true })

  return { message: "Success", data: rows.map(serializeAdminUser), meta }
})
