import type { AdminPermission } from "~~/shared/constants/permission"

/**
 * Everything under `/api/v1/admin` is behind the session cookie *and* the
 * permission table, both enforced in one place so a new handler is protected by
 * default rather than by remembering to call the guard. The resolved admin is
 * parked on the event context, so handlers that need the identity read it back
 * with `currentAdmin(event)` instead of hitting the database again.
 */

declare module "h3" {
  interface H3EventContext {
    admin?: AdminSession
  }
}

const ADMIN_PREFIX = "/api/v1/admin"

/** The two routes that must answer before a session exists. */
const OPEN_ROUTES = new Set([
  `${ADMIN_PREFIX}/auth/login`,
  `${ADMIN_PREFIX}/auth/session`,
])

/**
 * Which permission each route needs, matched in order — put the specific rule
 * above the prefix it sits inside. `methods` omitted means "any method";
 * `anyOf` passes when the admin holds at least one of the listed permissions.
 */
type Rule = {
  pattern: RegExp
  methods?: string[]
  anyOf: AdminPermission[]
}

const RULES: Rule[] = [
  // The admin's own account needs no grant beyond being signed in.
  { pattern: /^\/auth\//, anyOf: [] },
  { pattern: /^\/profile/, anyOf: [] },

  { pattern: /^\/dashboard/, anyOf: ["dashboard.view"] },

  { pattern: /^\/donations\/[^/]+\/verify/, anyOf: ["donation.verify"] },
  { pattern: /^\/donations/, methods: ["GET"], anyOf: ["donation.view"] },

  { pattern: /^\/campaigns/, methods: ["GET"], anyOf: ["campaign.view"] },
  { pattern: /^\/campaigns/, anyOf: ["campaign.manage"] },

  { pattern: /^\/updates/, methods: ["GET"], anyOf: ["update.view"] },
  { pattern: /^\/updates/, anyOf: ["update.manage"] },

  { pattern: /^\/duas/, methods: ["GET"], anyOf: ["dua.view"] },
  { pattern: /^\/duas/, anyOf: ["dua.moderate"] },

  { pattern: /^\/users/, methods: ["GET"], anyOf: ["user.view"] },
  { pattern: /^\/users/, anyOf: ["user.manage"] },

  { pattern: /^\/fundraisers/, methods: ["GET"], anyOf: ["fundraiser.view"] },
  { pattern: /^\/fundraisers/, anyOf: ["fundraiser.manage"] },

  { pattern: /^\/accounts/, anyOf: ["admin.manage"] },

  // Reading the role list also feeds the account form's role picker, so either
  // grant is enough; only writing a role needs `role.manage`.
  { pattern: /^\/roles/, methods: ["GET"], anyOf: ["role.manage", "admin.manage"] },
  { pattern: /^\/roles/, anyOf: ["role.manage"] },
]

export default eventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (!path.startsWith(ADMIN_PREFIX) || OPEN_ROUTES.has(path)) return

  const admin = await requireAdmin(event)
  event.context.admin = admin

  const route = path.slice(ADMIN_PREFIX.length)
  const method = event.method

  const rule = RULES.find(
    (candidate) =>
      candidate.pattern.test(route) &&
      (!candidate.methods || candidate.methods.includes(method)),
  )

  // An unmapped admin route is a mistake, not an open door: refuse it rather
  // than letting a new endpoint ship without an access decision.
  if (!rule) {
    throw createError({ status: 403, statusMessage: "Rute admin ini belum diberi izin" })
  }

  if (rule.anyOf.length && !rule.anyOf.some((name) => admin.permissions.includes(name))) {
    throw createError({
      status: 403,
      statusMessage: "Peran Anda tidak memiliki izin untuk tindakan ini",
    })
  }
})
