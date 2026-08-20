export default eventHandler(async (event): Promise<DeleteAdminFundraiser["response"]> => {
  const id = parseIdParam(event)

  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id },
    select: { id: true, _count: { select: { campaigns: true } } },
  })

  if (!fundraiser) {
    throw createError({ status: 404, statusMessage: "Lembaga tidak ditemukan" })
  }

  // `Campaign.fundraiserId` has no cascade rule, so the delete would fail at the
  // database level anyway — this says why instead of surfacing a constraint error.
  if (fundraiser._count.campaigns > 0) {
    throw createError({
      status: 409,
      statusMessage: "Lembaga masih memiliki campaign dan tidak dapat dihapus",
    })
  }

  await prisma.fundraiser.delete({ where: { id } })

  return { message: "Lembaga berhasil dihapus" }
})
