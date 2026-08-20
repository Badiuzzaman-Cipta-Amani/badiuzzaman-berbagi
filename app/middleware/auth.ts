/**
 * Guards the donor pages that only make sense with an account. The redirect
 * carries the requested path, so signing in lands where they were headed.
 *
 * This is deliberately **not** on the donate flow: giving without an account is
 * a supported path, not a degraded one.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { fetchSession, user } = useAuth()

  await fetchSession()

  if (!user.value) {
    return navigateTo({ path: "/masuk", query: { redirect: to.fullPath } })
  }
})
