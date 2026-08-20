import { adminPasswordSchema } from "~~/shared/validation/admin"

/**
 * Changing your own password requires proving you know the current one — the
 * session cookie alone is not enough, or an unattended browser becomes a
 * permanent account takeover.
 */
export default eventHandler(async (event): Promise<UpdateAdminPassword["response"]> => {
  const current = currentAdmin(event)
  const body = await readValidBody(event, adminPasswordSchema)

  const admin = await prisma.admin.findUnique({
    where: { id: BigInt(current.id) },
    select: { id: true, password: true },
  })

  if (!admin) {
    throw createError({ status: 404, statusMessage: "Admin tidak ditemukan" })
  }

  if (!(await verifyPassword(body.currentPassword, admin.password))) {
    throw createError({ status: 422, statusMessage: "Kata sandi saat ini tidak cocok" })
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { password: await hashPassword(body.password) },
  })

  return { message: "Kata sandi berhasil diperbarui" }
})
