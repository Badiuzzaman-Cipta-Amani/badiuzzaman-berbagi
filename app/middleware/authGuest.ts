/** Keeps a signed-in donor off the sign-in and register screens. */
export default defineNuxtRouteMiddleware(async () => {
  const { fetchSession, user } = useAuth()

  await fetchSession()

  if (user.value) return navigateTo("/akun")
})
