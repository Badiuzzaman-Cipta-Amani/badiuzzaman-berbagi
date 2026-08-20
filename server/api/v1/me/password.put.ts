import { userPasswordSchema } from "~~/shared/validation/auth"

/**
 * Changing your own password requires proving you know the current one — the
 * session cookie alone is not enough, or an unattended browser becomes a
 * permanent account takeover.
 */
export default eventHandler(async (event): Promise<UpdateUserPassword["response"]> => {
  const current = await requireUser(event)
  const body = await readValidBody(event, userPasswordSchema)

  const user = await prisma.user.findUnique({
    where: { id: BigInt(current.id) },
    select: { id: true, password: true },
  })

  if (!user) {
    throw createError({ status: 404, statusMessage: "Akun tidak ditemukan" })
  }

  if (!(await verifyPassword(body.currentPassword, user.password))) {
    throw createError({ status: 422, statusMessage: "Kata sandi saat ini tidak cocok" })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(body.password) },
  })

  return { message: "Kata sandi berhasil diperbarui" }
})
