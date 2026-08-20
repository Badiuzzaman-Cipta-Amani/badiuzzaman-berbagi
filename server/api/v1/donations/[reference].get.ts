/**
 * Status lookup by reference. A donor without an account still has to be able
 * to follow their own donation, so the reference *is* the credential: it is
 * random, six characters wide over a 32-symbol alphabet, and never sequential —
 * which is exactly why donations are not addressed by `id` here.
 */
export default eventHandler(async (event): Promise<TrackDonation["response"]> => {
  const reference = normalizeReference(getRouterParam(event, "reference"))

  const donation = await prisma.donation.findUnique({
    where: { reference },
    select: donationReceiptSelect,
  })

  if (!donation) {
    throw createError({ status: 404, statusMessage: "Donasi tidak ditemukan" })
  }

  return { message: "Success", data: serializeDonationReceipt(donation) }
})
