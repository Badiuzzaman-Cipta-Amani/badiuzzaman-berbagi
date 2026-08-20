import { userProfileSchema } from "~~/shared/validation/auth"

/**
 * A donor editing their own name, email, or phone. Deliberately separate from
 * the admin's `users/[id].put` — that one can also reset a password, and this
 * one must not.
 */
export default eventHandler(async (event): Promise<UpdateUserProfile["response"]> => {
  const current = await requireUser(event)
  const body = await readValidBody(event, userProfileSchema)

  const email = body.email.toLowerCase()

  const taken = await prisma.user.findFirst({
    where: { email, id: { not: BigInt(current.id) } },
    select: { id: true },
  })

  if (taken) {
    throw createError({
      status: 409,
      statusMessage: "Email ini sudah dipakai akun lain",
    })
  }

  const user = await prisma.user.update({
    where: { id: BigInt(current.id) },
    data: { name: body.name, email, phone: body.phone || null },
    select: authUserSelect,
  })

  return { message: "Profil berhasil diperbarui", data: serializeAuthUser(user) }
})
