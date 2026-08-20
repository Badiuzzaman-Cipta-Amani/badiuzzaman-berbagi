import { confirmDonationSchema } from "~~/shared/validation/donation"

/**
 * The donor's half of verification: "I have transferred, here is the proof."
 *
 * It records the proof and stamps `confirmedAt`, and deliberately does **not**
 * touch `status` or `raisedAmount`. Only `admin/donations/[id]/verify` moves
 * money, because only a human matching the bank statement can say the transfer
 * actually arrived.
 */
export default eventHandler(async (event): Promise<ConfirmDonation["response"]> => {
  const reference = normalizeReference(getRouterParam(event, "reference"))
  const body = await readValidBody(event, confirmDonationSchema)

  const existing = await prisma.donation.findUnique({
    where: { reference },
    select: { id: true, status: true },
  })

  if (!existing) {
    throw createError({ status: 404, statusMessage: "Donasi tidak ditemukan" })
  }

  // A settled donation is not waiting on proof any more, and re-opening one
  // would put the queue back to work an admin has already done.
  if (existing.status !== "pending") {
    throw createError({
      status: 409,
      statusMessage: "Donasi ini sudah diproses dan tidak memerlukan konfirmasi lagi",
    })
  }

  const donation = await prisma.donation.update({
    where: { id: existing.id },
    data: {
      proofUrl: body.proofUrl,
      proofNote: body.proofNote || null,
      confirmedAt: new Date(),
    },
    select: donationReceiptSelect,
  })

  return {
    message: "Konfirmasi terkirim. Tim kami akan memverifikasinya.",
    data: serializeDonationReceipt(donation),
  }
})
