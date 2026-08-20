export default eventHandler(async (event): Promise<DeleteAdminCampaign["response"]> => {
  const id = parseIdParam(event)

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { id: true, _count: { select: { donations: true } } },
  })

  if (!campaign) {
    throw createError({ status: 404, statusMessage: "Campaign tidak ditemukan" })
  }

  // Donations cascade with the campaign, which would erase money that was
  // already received. Cancelling is the correct move for a funded campaign.
  if (campaign._count.donations > 0) {
    throw createError({
      status: 409,
      statusMessage:
        "Campaign sudah memiliki donasi dan tidak dapat dihapus. Ubah statusnya menjadi dibatalkan.",
    })
  }

  await prisma.campaign.delete({ where: { id } })

  return { message: "Campaign berhasil dihapus" }
})
