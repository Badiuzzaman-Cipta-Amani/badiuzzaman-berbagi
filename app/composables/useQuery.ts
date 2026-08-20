/**
 * Every read goes through here, so the API base and the 401 redirect are
 * configured once. The base URL comes from runtime config
 * (`NUXT_PUBLIC_API_BASE`) and defaults to the app's own Nitro routes.
 */
export const useQuery = createUseFetch(() => ({
  baseURL: useRuntimeConfig().public.apiBase,
  async onResponseError({ response }) {
    if (response.status !== 401) return

    // The back office has its own session and its own sign-in screen, so an
    // expired admin cookie must not dump the user on the donor login page.
    const isAdmin = useRoute().path.startsWith("/admin")

    if (isAdmin) useAdminAuth().setSession(null)

    await navigateTo(isAdmin ? "/admin/login" : "/masuk")
  },
}))
