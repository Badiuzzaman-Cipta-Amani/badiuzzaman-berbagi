import { forgotPasswordSchema } from "~~/shared/validation/auth"

/**
 * Issues a single-use reset grant. The response is identical whether or not the
 * address is registered, so this endpoint cannot be used to test which emails
 * have accounts here.
 *
 * There is no mail transport wired up, so rather than claim an email was sent,
 * the link comes straight back in `resetUrl` and the page says exactly that.
 * When a mailer lands, send the link and return `null` — the client already
 * handles that branch.
 */
export default eventHandler(async (event): Promise<ForgotPasswordUser["response"]> => {
  const body = await readValidBody(event, forgotPasswordSchema)

  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
    select: { id: true },
  })

  if (!user) {
    return {
      message: "Jika email tersebut terdaftar, tautan atur ulang telah dibuat.",
      data: { resetUrl: null },
    }
  }

  const token = await issuePasswordReset(user.id)
  const origin = getRequestURL(event).origin

  return {
    message: "Jika email tersebut terdaftar, tautan atur ulang telah dibuat.",
    data: { resetUrl: `${origin}/atur-ulang-sandi?token=${token}` },
  }
})
