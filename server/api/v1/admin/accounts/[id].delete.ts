export default eventHandler(async (event): Promise<DeleteAdminAccount["response"]> => {
  const current = currentAdmin(event)
  const id = parseIdParam(event)

  if (current.id === id.toString()) {
    throw createError({
      status: 409,
      statusMessage: "Anda tidak dapat menghapus akun Anda sendiri",
    })
  }

  const admin = await prisma.admin.findUnique({
    where: { id },
    select: { id: true, _count: { select: { verifiedDonations: true } } },
  })

  if (!admin) {
    throw createError({ status: 404, statusMessage: "Admin tidak ditemukan" })
  }

  // Verification history names the admin who signed off. Deleting the account
  // would blank that trail, so a reviewer is deactivated rather than removed.
  if (admin._count.verifiedDonations > 0) {
    throw createError({
      status: 409,
      statusMessage:
        "Admin ini pernah memverifikasi donasi. Nonaktifkan akunnya agar riwayat verifikasi tetap utuh.",
    })
  }

  await prisma.admin.delete({ where: { id } })

  return { message: "Admin berhasil dihapus" }
})
