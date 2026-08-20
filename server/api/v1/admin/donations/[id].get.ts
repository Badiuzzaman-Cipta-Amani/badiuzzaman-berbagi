export default eventHandler(async (event): Promise<DetailAdminDonation["response"]> => {
  const id = parseIdParam(event)

  const donation = await prisma.donation.findUnique({
    where: { id },
    select: adminDonationDetailSelect,
  })

  if (!donation) {
    throw createError({ status: 404, statusMessage: "Donasi tidak ditemukan" })
  }

  return { message: "Success", data: serializeAdminDonationDetail(donation) }
})
