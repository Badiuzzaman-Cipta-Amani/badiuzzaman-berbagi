import { adminLoginSchema } from "~~/shared/validation/admin"

export default eventHandler(async (event): Promise<LoginAdmin["response"]> => {
  const body = await readValidBody(event, adminLoginSchema)

  const admin = await prisma.admin.findUnique({
    where: { email: body.email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      isActive: true,
      lastLoginAt: true,
      role: { select: { id: true, name: true, label: true, permissions: true } },
    },
  })

  // A missing account and a wrong password answer identically, so the response
  // cannot be used to enumerate which admin emails exist.
  const valid = admin ? await verifyPassword(body.password, admin.password) : false

  if (!admin || !valid) {
    throw createError({ status: 401, statusMessage: "Email atau kata sandi salah" })
  }

  if (!admin.isActive) {
    throw createError({
      status: 403,
      statusMessage: "Akun ini dinonaktifkan. Hubungi super admin.",
    })
  }

  await startAdminSession(event, admin.id)

  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      lastLoginAt: true,
      role: { select: { id: true, name: true, label: true, permissions: true } },
    },
  })

  return { message: "Berhasil masuk", data: serializeAdminSession(updated) }
})
