import { registerSchema } from "~~/shared/validation/auth"

export default eventHandler(async (event): Promise<RegisterUser["response"]> => {
  const body = await readValidBody(event, registerSchema)

  const email = body.email.toLowerCase()

  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } })

  if (taken) {
    throw createError({ status: 409, statusMessage: "Email ini sudah terdaftar" })
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email,
      phone: body.phone || null,
      password: await hashPassword(body.password),
    },
    select: authUserSelect,
  })

  // Registering signs you in — asking someone to type the same password twice in
  // a row to reach the page they just created an account for is busywork.
  await startUserSession(event, user.id)

  return { message: "Akun berhasil dibuat", data: serializeAuthUser(user) }
})
