import type { Prisma } from "~~/prisma/generated/client"

export const duaSelect = {
  id: true,
  donorName: true,
  message: true,
  amount: true,
  status: true,
  createdAt: true,
  campaign: { select: { slug: true, title: true } },
} satisfies Prisma.DonationSelect

type DuaRow = Prisma.DonationGetPayload<{ select: typeof duaSelect }>

export function serializeDua(dua: DuaRow): DuaItem {
  return {
    id: dua.id.toString(),
    donorName: dua.donorName || "Hamba Allah",
    message: dua.message ?? "",
    amount: Number(dua.amount),
    status: dua.status,
    createdAt: dua.createdAt.toISOString(),
    campaign: dua.campaign,
  }
}

/**
 * Only donations that actually carry a prayer are shown as duas, and only while
 * an admin has not hidden the message from the moderation screen.
 */
export const duaWhere = {
  message: { not: null },
  isDuaHidden: false,
} satisfies Prisma.DonationWhereInput
