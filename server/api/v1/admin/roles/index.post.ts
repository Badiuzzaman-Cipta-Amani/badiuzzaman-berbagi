import { sanitizePermissions } from "~~/shared/constants/permission"
import { adminRoleSchema } from "~~/shared/validation/admin"

export default eventHandler(async (event): Promise<CreateAdminRole["response"]> => {
  const body = await readValidBody(event, adminRoleSchema)

  const existing = await prisma.role.findUnique({
    where: { name: body.name },
    select: { id: true },
  })

  if (existing) {
    throw createError({ status: 409, statusMessage: "Peran dengan nama ini sudah ada" })
  }

  const role = await prisma.role.create({
    data: {
      name: body.name,
      label: body.label,
      description: body.description || null,
      // Re-filtered server-side: the form is not the authority on what a
      // permission key is.
      permissions: sanitizePermissions(body.permissions),
    },
    select: adminRoleSelect,
  })

  return { message: "Peran berhasil ditambahkan", data: serializeAdminRole(role) }
})
