/**
 * Donor session state, wired to `/api/v1/auth/*`. Built the same way
 * `useAdminAuth` is — the cookie lives on the server and only
 * `/auth/session` can say whether it is still good — but it is a separate
 * session entirely: nothing here grants anything in the back office.
 *
 * Donating never requires this. `getUserSessionId` on the server attributes a
 * donation to an account when there is one and shrugs when there is not.
 */
export function useAuth() {
  const user = useState<AuthUser | null>("auth:user", () => null)
  /** Distinguishes "not signed in" from "have not asked yet". */
  const resolved = useState("auth:user:resolved", () => false)

  const isLoggedIn = computed(() => Boolean(user.value))

  const apiBase = () => useRuntimeConfig().public.apiBase

  const setUser = (next: AuthUser | null) => {
    user.value = next
    resolved.value = true
  }

  const fetchSession = async (force = false) => {
    if (resolved.value && !force) return user.value

    try {
      const response = await $fetch<SessionUser["response"]>("/auth/session", {
        baseURL: apiBase(),
      })
      setUser(response.data)
    } catch {
      // A network failure is not a signed-in state.
      setUser(null)
    }

    return user.value
  }

  const logout = async (redirectTo = "/masuk") => {
    try {
      await $fetch("/auth/logout", { baseURL: apiBase(), method: "POST" })
    } finally {
      setUser(null)
      await navigateTo(redirectTo)
    }
  }

  return { user, isLoggedIn, resolved, setUser, fetchSession, logout }
}
