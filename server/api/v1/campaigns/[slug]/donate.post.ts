import { donateSchema } from "~~/shared/validation/donate"

export default eventHandler(async (event): Promise<DonateCampaign["response"]> => {
  const slug = getRouterParam(event, "slug")

  if (!slug) {
    throw createError({ status: 400, statusMessage: "Campaign slug is required" })
  }

  const body = await readValidBody(event, donateSchema)

  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: { id: true, status: true },
  })

  if (!campaign) {
    throw createError({ status: 404, statusMessage: "Campaign not found" })
  }

  if (campaign.status !== "active") {
    throw createError({
      status: 409,
      statusMessage: "Campaign ini sudah tidak menerima donasi",
    })
  }

  /**
   * Giving without an account stays possible on purpose — this reads the session
   * to *attribute* the donation when there is one, never to require one. A guest
   * donation simply carries no `userId` and is followed by its reference.
   */
  const userId = await getUserSessionId(event)

  // Stays `pending` until an admin verifies it, so `raisedAmount` — which tracks
  // verified funds only — is deliberately left untouched here.
  const donation = await prisma.donation.create({
    data: {
      campaignId: campaign.id,
      userId,
      reference: await generateDonationReference(),
      // The roster is what the donor typed; `donorName` is derived from it here
      // and nowhere else, so the display copy can never fall out of step.
      donorNames: body.donorNames,
      donorName: joinDonorNames(body.donorNames),
      message: body.message,
      amount: BigInt(body.amount),
    },
    select: donationReceiptSelect,
  })

  return {
    message: "Donasi berhasil dicatat. Menunggu verifikasi.",
    data: serializeDonationReceipt(donation),
  }
})
