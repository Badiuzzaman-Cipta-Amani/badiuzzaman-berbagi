import { adminUserUpdateSchema } from "~~/shared/validation/admin"

export default eventHandler(async (event): Promise<UpdateAdminUser["response"]> => {
  const id = parseIdParam(event)
  const body = await readValidBody(event, adminUserUpdateSchema)

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })

  if (!existing) {
    throw createError({ status: 404, statusMessage: "Donatur tidak ditemukan" })
  }

  const emailOwner = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true },
  })

  if (emailOwner && emailOwner.id !== id) {
    throw createError({ status: 409, statusMessage: "Email sudah dipakai donatur lain" })
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      // Blank means "leave the stored hash alone" rather than "clear the password".
      ...(body.password ? { password: await hashPassword(body.password) } : {}),
    },
    select: adminUserSelect,
  })

  return { message: "Donatur berhasil diperbarui", data: serializeAdminUser(user) }
})
