import { adminAccountUpdateSchema } from "~~/shared/validation/admin"

export default eventHandler(async (event): Promise<UpdateAdminAccount["response"]> => {
  const current = currentAdmin(event)

  const id = parseIdParam(event)
  const body = await readValidBody(event, adminAccountUpdateSchema)

  const existing = await prisma.admin.findUnique({ where: { id }, select: { id: true } })

  if (!existing) {
    throw createError({ status: 404, statusMessage: "Admin tidak ditemukan" })
  }

  // Deactivating yourself would end the session that is making the request.
  if (current.id === id.toString() && !body.isActive) {
    throw createError({
      status: 409,
      statusMessage: "Anda tidak dapat menonaktifkan akun Anda sendiri",
    })
  }

  const [emailOwner, role] = await Promise.all([
    prisma.admin.findUnique({ where: { email: body.email }, select: { id: true } }),
    prisma.role.findUnique({ where: { id: body.roleId }, select: { id: true } }),
  ])

  if (emailOwner && emailOwner.id !== id) {
    throw createError({ status: 409, statusMessage: "Email sudah dipakai admin lain" })
  }

  if (!role) {
    throw createError({ status: 422, statusMessage: "Peran tidak ditemukan" })
  }

  const admin = await prisma.admin.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email,
      roleId: body.roleId,
      isActive: body.isActive,
      ...(body.password ? { password: await hashPassword(body.password) } : {}),
    },
    select: adminAccountSelect,
  })

  return { message: "Admin berhasil diperbarui", data: serializeAdminAccount(admin) }
})
