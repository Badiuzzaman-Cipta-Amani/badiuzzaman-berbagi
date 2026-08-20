import { adminUserCreateSchema } from "~~/shared/validation/admin"

export default eventHandler(async (event): Promise<CreateAdminUser["response"]> => {
  const body = await readValidBody(event, adminUserCreateSchema)

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true },
  })

  if (existing) {
    throw createError({ status: 409, statusMessage: "Email sudah terdaftar" })
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      password: await hashPassword(body.password),
    },
    select: adminUserSelect,
  })

  return { message: "Donatur berhasil ditambahkan", data: serializeAdminUser(user) }
})
