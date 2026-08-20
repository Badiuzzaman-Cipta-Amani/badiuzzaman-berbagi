import type { Prisma } from "~~/prisma/generated/client"

export default eventHandler(async (event): Promise<PaginateAdminAccount["response"]> => {
  const query = getQuery(event)

  const page = normalizePage(query.page)
  const size = normalizeSize(query.size)
  const search = String(query.search ?? "").trim()
  const roleId = Number(query.roleId)
  const status = String(query.status ?? "")

  const where: Prisma.AdminWhereInput = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  if (Number.isInteger(roleId) && roleId > 0) where.roleId = roleId
  if (status === "active") where.isActive = true
  if (status === "inactive") where.isActive = false

  const [rows, meta] = await prisma.admin
    .paginate({ where, orderBy: { createdAt: "desc" }, select: adminAccountSelect })
    .withPages({ page, limit: size, includePageCount: true })

  return { message: "Success", data: rows.map(serializeAdminAccount), meta }
})
