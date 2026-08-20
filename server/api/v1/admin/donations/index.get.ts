import type { Prisma } from "~~/prisma/generated/client"

import { DonationStatus } from "~~/prisma/generated/enums"

function parseOrderBy(sort: unknown): Prisma.DonationOrderByWithRelationInput {
  switch (String(sort ?? "")) {
    case "oldest":
      return { createdAt: "asc" }
    case "highest":
      return { amount: "desc" }
    case "lowest":
      return { amount: "asc" }
    default:
      return { createdAt: "desc" }
  }
}

export default eventHandler(async (event): Promise<PaginateAdminDonation["response"]> => {
  const query = getQuery(event)

  const page = normalizePage(query.page)
  const size = normalizeSize(query.size)
  const search = String(query.search ?? "").trim()
  const campaign = String(query.campaign ?? "").trim()
  const rawStatus = String(query.status ?? "")
  const status = Object.hasOwn(DonationStatus, rawStatus)
    ? (rawStatus as DonationStatus)
    : undefined

  const where: Prisma.DonationWhereInput = {}

  if (search) {
    where.OR = [
      { donorName: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ]
  }

  if (status) where.status = status
  if (campaign) where.campaign = { slug: campaign }

  const [rows, meta] = await prisma.donation
    .paginate({ where, orderBy: parseOrderBy(query.sort), select: adminDonationSelect })
    .withPages({ page, limit: size, includePageCount: true })

  return { message: "Success", data: rows.map(serializeAdminDonation), meta }
})
