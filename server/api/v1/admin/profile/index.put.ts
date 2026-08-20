import { adminProfileSchema } from "~~/shared/validation/admin"

/**
 * An admin editing their own name and email. Deliberately separate from
 * `accounts/[id].put`: that one can change a role and an active flag, and is
 * gated on `admin.manage`. This one is available to every signed-in admin and
 * cannot touch either field.
 */
export default eventHandler(async (event): Promise<UpdateAdminProfile["response"]> => {
  const current = currentAdmin(event)
  const body = await readValidBody(event, adminProfileSchema)

  const emailOwner = await prisma.admin.findUnique({
    where: { email: body.email },
    select: { id: true },
  })

  if (emailOwner && emailOwner.id.toString() !== current.id) {
    throw createError({ status: 409, statusMessage: "Email sudah dipakai admin lain" })
  }

  const admin = await prisma.admin.update({
    where: { id: BigInt(current.id) },
    data: { name: body.name, email: body.email },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      lastLoginAt: true,
      role: { select: { id: true, name: true, label: true, permissions: true } },
    },
  })

  return { message: "Profil berhasil diperbarui", data: serializeAdminSession(admin) }
})
