export default eventHandler(async (event): Promise<DeleteAdminUser["response"]> => {
  const id = parseIdParam(event)

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })

  if (!user) {
    throw createError({ status: 404, statusMessage: "Donatur tidak ditemukan" })
  }

  // `Donation.userId` is `onDelete: SetNull`, so the money and its dua survive
  // the account being removed — only the link back to the person is dropped.
  await prisma.user.delete({ where: { id } })

  return { message: "Donatur berhasil dihapus" }
})
