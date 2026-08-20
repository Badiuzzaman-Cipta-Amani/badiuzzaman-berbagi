import type { AdminPermission } from "~~/shared/constants/permission"

import { SUPER_ADMIN_ROLE } from "~~/shared/constants/permission"

/**
 * Back-office session state. Unlike `useAuth` — which still has no endpoint
 * behind it — this is wired to a real API: the cookie lives on the server and
 * `/admin/auth/session` is the only thing that can tell us whether it is valid.
 */
export function useAdminAuth() {
  const admin = useState<AdminSession | null>("admin:session", () => null)
  /** Distinguishes "not signed in" from "have not asked yet". */
  const resolved = useState("admin:session:resolved", () => false)

  const isLoggedIn = computed(() => Boolean(admin.value))
  const isSuperAdmin = computed(() => admin.value?.role.name === SUPER_ADMIN_ROLE)

  /**
   * Hides what the server would refuse anyway. The API is still the authority —
   * this only keeps the UI from offering a door that is locked.
   */
  const can = (...permissions: AdminPermission[]) =>
    permissions.some((permission) => admin.value?.permissions.includes(permission))

  const apiBase = () => useRuntimeConfig().public.apiBase

  const setSession = (session: AdminSession | null) => {
    admin.value = session
    resolved.value = true
  }

  const fetchSession = async (force = false) => {
    if (resolved.value && !force) return admin.value

    try {
      const response = await $fetch<SessionAdmin["response"]>("/admin/auth/session", {
        baseURL: apiBase(),
      })
      setSession(response.data)
    } catch {
      // A network failure is not a signed-in state; the guard sends them to login.
      setSession(null)
    }

    return admin.value
  }

  const logout = async () => {
    try {
      await $fetch("/admin/auth/logout", { baseURL: apiBase(), method: "POST" })
    } finally {
      setSession(null)
      await navigateTo("/admin/login")
    }
  }

  return {
    admin,
    isLoggedIn,
    isSuperAdmin,
    can,
    resolved,
    setSession,
    fetchSession,
    logout,
  }
}
