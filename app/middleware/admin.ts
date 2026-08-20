import { adminNavGroups, adminProfileNavItem } from "~/constants/adminNav"

/**
 * Guards every `/admin` page except the login screen. The redirect carries the
 * requested path so signing in lands where the admin was actually headed.
 *
 * A signed-in admin can still be pointed at a page their role cannot open —
 * `/admin` itself, for a role without `dashboard.view`. Rather than let the page
 * render and fill with 403s, send them to the first menu entry they do hold.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { fetchSession, admin, can } = useAdminAuth()

  await fetchSession()

  if (!admin.value) {
    return navigateTo({ path: "/admin/login", query: { redirect: to.fullPath } })
  }

  // The profile page left the sidebar but is still a reachable admin route, so
  // it has to be matched here or it would fall through as "unknown" and bounce.
  const entries = [...adminNavGroups.flatMap((group) => group.items), adminProfileNavItem]

  const target = entries.find((item) =>
    item.exact
      ? to.path === item.to
      : to.path === item.to || to.path.startsWith(`${item.to}/`),
  )

  if (!target || !target.anyOf || can(...target.anyOf)) return

  // `adminProfileNavItem` carries no `anyOf`, so this always has somewhere to land.
  const fallback = entries.find((item) => !item.anyOf || can(...item.anyOf))

  return navigateTo(fallback?.to ?? "/admin/profil")
})
