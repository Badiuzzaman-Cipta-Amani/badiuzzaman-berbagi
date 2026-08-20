/** Keeps a signed-in admin off the login screen. */
export default defineNuxtRouteMiddleware(async () => {
  const { fetchSession, admin } = useAdminAuth()

  await fetchSession()

  if (admin.value) return navigateTo("/admin")
})
