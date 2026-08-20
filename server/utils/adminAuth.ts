import type { H3Event } from "h3"
import type { Prisma } from "~~/prisma/generated/client"
import type { AdminPermission } from "~~/shared/constants/permission"

import bcrypt from "bcryptjs"
import {
  ADMIN_PERMISSIONS,
  SUPER_ADMIN_ROLE,
  sanitizePermissions,
} from "~~/shared/constants/permission"

/**
 * Admin sessions ride in an h3 sealed cookie — encrypted and signed with
 * `runtimeConfig.adminSessionPassword`, so nothing but the server can read or
 * forge one. The cookie holds the admin id only; every request re-reads the
 * account so a deactivated admin loses access on their next call, not at expiry.
 */

const SESSION_NAME = "admin_session"
const SESSION_MAX_AGE = 60 * 60 * 8

type AdminSessionData = { adminId?: string }

const adminSessionSelect = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  lastLoginAt: true,
  role: { select: { id: true, name: true, label: true, permissions: true } },
} satisfies Prisma.AdminSelect

type AdminSessionRow = Prisma.AdminGetPayload<{ select: typeof adminSessionSelect }>

/**
 * The permissions this admin actually holds. `super_admin` is resolved here
 * rather than stored, so the role that edits permissions can never revoke its
 * own access to that screen.
 */
export function resolvePermissions(role: {
  name: string
  permissions: string[]
}): AdminPermission[] {
  if (role.name === SUPER_ADMIN_ROLE) return [...ADMIN_PERMISSIONS]
  return sanitizePermissions(role.permissions)
}

export function serializeAdminSession(admin: AdminSessionRow): AdminSession {
  return {
    id: admin.id.toString(),
    name: admin.name,
    email: admin.email,
    role: {
      id: admin.role.id,
      name: admin.role.name,
      label: admin.role.label,
    },
    permissions: resolvePermissions(admin.role),
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
  }
}

function sessionConfig(event: H3Event) {
  return {
    name: SESSION_NAME,
    password: useRuntimeConfig(event).adminSessionPassword,
    maxAge: SESSION_MAX_AGE,
    cookie: { sameSite: "lax" as const },
  }
}

export async function startAdminSession(event: H3Event, adminId: bigint) {
  const session = await useSession<AdminSessionData>(event, sessionConfig(event))
  await session.update({ adminId: adminId.toString() })
}

export async function endAdminSession(event: H3Event) {
  const session = await useSession<AdminSessionData>(event, sessionConfig(event))
  await session.clear()
}

/** The signed-in admin, or `null` when the cookie is missing, stale, or deactivated. */
export async function getAdminSession(event: H3Event): Promise<AdminSession | null> {
  const session = await useSession<AdminSessionData>(event, sessionConfig(event))
  const adminId = session.data.adminId

  if (!adminId) return null

  const admin = await prisma.admin.findUnique({
    where: { id: BigInt(adminId) },
    select: adminSessionSelect,
  })

  if (!admin || !admin.isActive) {
    await session.clear()
    return null
  }

  return serializeAdminSession(admin)
}

/** Same, but 401s instead of returning `null`. Use in every guarded handler. */
export async function requireAdmin(event: H3Event): Promise<AdminSession> {
  const admin = await getAdminSession(event)

  if (!admin) {
    throw createError({ status: 401, statusMessage: "Sesi admin tidak ditemukan" })
  }

  return admin
}

/**
 * The admin `server/middleware/adminGuard.ts` already resolved for this request.
 * Reading it back costs nothing, unlike calling `requireAdmin` a second time.
 */
export function currentAdmin(event: H3Event): AdminSession {
  const admin = event.context.admin

  if (!admin) {
    throw createError({ status: 401, statusMessage: "Sesi admin tidak ditemukan" })
  }

  return admin
}

/**
 * The authorization check every guarded handler makes. Reads the admin the
 * middleware already resolved, so it costs no extra query.
 */
export function requirePermission(
  event: H3Event,
  permission: AdminPermission,
): AdminSession {
  const admin = currentAdmin(event)

  if (!admin.permissions.includes(permission)) {
    throw createError({
      status: 403,
      statusMessage: "Peran Anda tidak memiliki izin untuk tindakan ini",
    })
  }

  return admin
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10)

export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash)
