import { adminAccountCreateSchema } from "~~/shared/validation/admin"

export default eventHandler(async (event): Promise<CreateAdminAccount["response"]> => {
  const body = await readValidBody(event, adminAccountCreateSchema)

  const [existing, role] = await Promise.all([
    prisma.admin.findUnique({ where: { email: body.email }, select: { id: true } }),
    prisma.role.findUnique({ where: { id: body.roleId }, select: { id: true } }),
  ])

  if (existing) {
    throw createError({ status: 409, statusMessage: "Email admin sudah terdaftar" })
  }

  if (!role) {
    throw createError({ status: 422, statusMessage: "Peran tidak ditemukan" })
  }

  const admin = await prisma.admin.create({
    data: {
      name: body.name,
      email: body.email,
      password: await hashPassword(body.password),
      roleId: body.roleId,
      isActive: body.isActive,
    },
    select: adminAccountSelect,
  })

  return { message: "Admin berhasil ditambahkan", data: serializeAdminAccount(admin) }
})
