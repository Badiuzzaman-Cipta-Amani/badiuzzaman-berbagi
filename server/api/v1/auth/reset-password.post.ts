import { resetPasswordSchema } from "~~/shared/validation/auth"

export default eventHandler(async (event): Promise<ResetPasswordUser["response"]> => {
  const body = await readValidBody(event, resetPasswordSchema)

  // The table stores only the hash, so the lookup is by hash too.
  const grant = await prisma.passwordReset.findUnique({
    where: { tokenHash: hashResetToken(body.token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  })

  if (!grant || grant.usedAt || grant.expiresAt.getTime() < Date.now()) {
    throw createError({
      status: 400,
      statusMessage: "Tautan atur ulang sudah tidak berlaku. Silakan minta yang baru.",
    })
  }

  // Marking the grant used and writing the password have to move together, or a
  // failure between them leaves a live token pointing at a changed account.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: grant.userId },
      data: { password: await hashPassword(body.password) },
    }),
    prisma.passwordReset.update({
      where: { id: grant.id },
      data: { usedAt: new Date() },
    }),
  ])

  // Every other outstanding grant for this donor dies with it.
  await prisma.passwordReset.deleteMany({
    where: { userId: grant.userId, usedAt: null },
  })

  return { message: "Kata sandi berhasil diperbarui. Silakan masuk kembali." }
})
