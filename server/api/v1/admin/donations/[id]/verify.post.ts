import { adminDonationVerifySchema } from "~~/shared/validation/admin"

/**
 * The one place `Campaign.raisedAmount` moves. That column tracks verified funds
 * only, so the delta is derived from the transition rather than from the new
 * status alone — un-verifying a donation has to give the money back.
 */
export default eventHandler(async (event): Promise<VerifyAdminDonation["response"]> => {
  const id = parseIdParam(event)
  const admin = currentAdmin(event)
  const body = await readValidBody(event, adminDonationVerifySchema)

  const donation = await prisma.donation.findUnique({
    where: { id },
    select: { id: true, amount: true, status: true, campaignId: true },
  })

  if (!donation) {
    throw createError({ status: 404, statusMessage: "Donasi tidak ditemukan" })
  }

  if (donation.status === body.status) {
    throw createError({
      status: 409,
      statusMessage: `Donasi ini sudah berstatus ${body.status === "verified" ? "terverifikasi" : "ditolak"}`,
    })
  }

  const wasVerified = donation.status === "verified"
  const willBeVerified = body.status === "verified"

  // `BigInt(0)` rather than `0n`: the Nitro build targets es2019, where a BigInt
  // literal is a syntax error the bundler only warns about.
  const noChange = BigInt(0)
  const delta = willBeVerified
    ? donation.amount
    : wasVerified
      ? -donation.amount
      : noChange

  await prisma.$transaction(async (tx) => {
    await tx.donation.update({
      where: { id },
      data: {
        status: body.status,
        verifiedAt: willBeVerified ? new Date() : null,
        verifiedById: BigInt(admin.id),
        reviewNote: body.reviewNote || null,
      },
    })

    if (delta !== noChange) {
      await tx.campaign.update({
        where: { id: donation.campaignId },
        data: { raisedAmount: { increment: delta } },
      })
    }
  })

  const updated = await prisma.donation.findUniqueOrThrow({
    where: { id },
    select: adminDonationDetailSelect,
  })

  return {
    message: willBeVerified ? "Donasi berhasil diverifikasi" : "Donasi ditolak",
    data: serializeAdminDonationDetail(updated),
  }
})
