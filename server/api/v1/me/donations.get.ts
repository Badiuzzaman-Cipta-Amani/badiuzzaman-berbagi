import type { Prisma } from "~~/prisma/generated/client"

import { DonationStatus } from "~~/prisma/generated/enums"

/** The signed-in donor's own donation history, newest first. */
export default eventHandler(async (event): Promise<PaginateMyDonation["response"]> => {
  const current = await requireUser(event)
  const query = getQuery(event)

  const page = normalizePage(query.page)
  const size = normalizeSize(query.size)
  const status = String(query.status ?? "")

  const where: Prisma.DonationWhereInput = { userId: BigInt(current.id) }

  // Checked against the generated enum before it reaches Prisma; `Object.hasOwn`
  // rather than `in`, which would walk the prototype chain.
  if (status && Object.hasOwn(DonationStatus, status)) {
    where.status = status as DonationStatus
  }

  const [rows, meta] = await prisma.donation
    .paginate({
      where,
      orderBy: { createdAt: "desc" },
      select: donationReceiptSelect,
    })
    .withPages({ page, limit: size, includePageCount: true })

  return { message: "Success", data: rows.map(serializeDonationReceipt), meta }
})
