import { loginSchema } from "~~/shared/validation/auth"

export default eventHandler(async (event): Promise<LoginUser["response"]> => {
  const body = await readValidBody(event, loginSchema)

  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
    select: { ...authUserSelect, password: true },
  })

  /**
   * One message for both "no such email" and "wrong password". Telling them
   * apart turns the login form into a register of who has an account here, and
   * a donation platform's donor list is not something to hand out.
   */
  const invalid = createError({
    status: 401,
    statusMessage: "Email atau kata sandi tidak cocok",
  })

  if (!user) throw invalid
  if (!(await verifyPassword(body.password, user.password))) throw invalid

  await startUserSession(event, user.id)

  return { message: "Berhasil masuk", data: serializeAuthUser(user) }
})
