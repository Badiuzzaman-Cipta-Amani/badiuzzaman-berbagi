export default eventHandler(async (event): Promise<DetailAdminUser["response"]> => {
  const id = parseIdParam(event)

  const user = await prisma.user.findUnique({
    where: { id },
    select: adminUserSelect,
  })

  if (!user) {
    throw createError({ status: 404, statusMessage: "Donatur tidak ditemukan" })
  }

  const donations = await prisma.donation.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: adminDonationSelect,
  })

  return {
    message: "Success",
    data: {
      ...serializeAdminUser(user),
      donations: donations.map(serializeAdminDonation),
    },
  }
})
