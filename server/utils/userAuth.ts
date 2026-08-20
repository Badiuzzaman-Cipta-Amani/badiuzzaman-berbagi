import type { H3Event } from "h3"
import type { Prisma } from "~~/prisma/generated/client"

import { createHash, randomBytes } from "node:crypto"

/**
 * Donor sessions, built the same way admin sessions are: an h3 sealed cookie
 * holding the **id only**, with the row re-read on every request so a deleted
 * account loses access on its next call rather than at expiry.
 *
 * It is a different cookie name and a different password from `admin_session`
 * on purpose — a `User` and an `Admin` are unrelated tables, and holding one
 * session must never imply anything about the other.
 */

const SESSION_NAME = "user_session"
/** Thirty days: a donor comes back when they donate, not when they log in. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 30

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60

type UserSessionData = { userId?: string }

export const authUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  createdAt: true,
  _count: { select: { donations: true } },
  donations: { where: { status: "verified" }, select: { amount: true } },
} satisfies Prisma.UserSelect

type AuthUserRow = Prisma.UserGetPayload<{ select: typeof authUserSelect }>

export function serializeAuthUser(user: AuthUserRow): AuthUser {
  return {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt.toISOString(),
    totalDonation: user._count.donations,
    totalDonated: user.donations.reduce((sum, row) => sum + Number(row.amount), 0),
  }
}

function sessionConfig(event: H3Event) {
  return {
    name: SESSION_NAME,
    password: useRuntimeConfig(event).userSessionPassword,
    maxAge: SESSION_MAX_AGE,
    cookie: { sameSite: "lax" as const },
  }
}

export async function startUserSession(event: H3Event, userId: bigint) {
  const session = await useSession<UserSessionData>(event, sessionConfig(event))
  await session.update({ userId: userId.toString() })
}

export async function endUserSession(event: H3Event) {
  const session = await useSession<UserSessionData>(event, sessionConfig(event))
  await session.clear()
}

/** The signed-in donor, or `null` when the cookie is missing or points at nothing. */
export async function getUserSession(event: H3Event): Promise<AuthUser | null> {
  const session = await useSession<UserSessionData>(event, sessionConfig(event))
  const userId = session.data.userId

  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: authUserSelect,
  })

  if (!user) {
    await session.clear()
    return null
  }

  return serializeAuthUser(user)
}

/**
 * The signed-in donor's id, without the extra columns. Used by `donate.post.ts`,
 * which only needs to know whether to attribute the donation to an account.
 */
export async function getUserSessionId(event: H3Event): Promise<bigint | null> {
  const session = await useSession<UserSessionData>(event, sessionConfig(event))
  const userId = session.data.userId

  if (!userId) return null

  const exists = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    select: { id: true },
  })

  return exists?.id ?? null
}

/** Same, but 401s instead of returning `null`. Use in every `/me` handler. */
export async function requireUser(event: H3Event): Promise<AuthUser> {
  const user = await getUserSession(event)

  if (!user) {
    throw createError({ status: 401, statusMessage: "Anda belum masuk" })
  }

  return user
}

/* Password reset ----------------------------------------------------------- */

/**
 * Only the hash of the token is stored, so a leaked `password_resets` table
 * cannot be replayed against the reset endpoint — the same reason a password
 * column holds a hash rather than the password.
 */
export const hashResetToken = (token: string) =>
  createHash("sha256").update(token).digest("hex")

export async function issuePasswordReset(userId: bigint) {
  const token = randomBytes(32).toString("hex")

  // A new request invalidates the outstanding ones, so a forwarded old email
  // cannot be used after the donor has asked again.
  await prisma.passwordReset.deleteMany({ where: { userId, usedAt: null } })

  await prisma.passwordReset.create({
    data: {
      userId,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  })

  return token
}
