import { SUPER_ADMIN_ROLE, sanitizePermissions } from "~~/shared/constants/permission"
import { adminRoleSchema } from "~~/shared/validation/admin"

export default eventHandler(async (event): Promise<UpdateAdminRole["response"]> => {
  const id = parseIntParam(event)
  const body = await readValidBody(event, adminRoleSchema)

  const existing = await prisma.role.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!existing) {
    throw createError({ status: 404, statusMessage: "Peran tidak ditemukan" })
  }

  const isSystem = existing.name === SUPER_ADMIN_ROLE

  // `super_admin` is resolved by name and holds every permission implicitly.
  // Renaming it would silently strip the back office of its only full account.
  if (isSystem && body.name !== SUPER_ADMIN_ROLE) {
    throw createError({
      status: 409,
      statusMessage: "Peran super_admin tidak dapat diganti namanya",
    })
  }

  const nameOwner = await prisma.role.findUnique({
    where: { name: body.name },
    select: { id: true },
  })

  if (nameOwner && nameOwner.id !== id) {
    throw createError({ status: 409, statusMessage: "Peran dengan nama ini sudah ada" })
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      name: body.name,
      label: body.label,
      description: body.description || null,
      // Writing permissions onto `super_admin` would be theatre — they are
      // resolved from the name, so the stored list is left untouched.
      ...(isSystem ? {} : { permissions: sanitizePermissions(body.permissions) }),
    },
    select: adminRoleSelect,
  })

  return { message: "Peran berhasil diperbarui", data: serializeAdminRole(role) }
})
