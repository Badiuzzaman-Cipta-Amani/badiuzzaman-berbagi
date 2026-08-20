import type { AdminPermission } from "../../../constants/permission"
import type { DataResponse, MessageResponse } from "../../response"

/**
 * The admin identity as the dashboard sees it. Mirrors what the sealed session
 * cookie carries, minus anything the browser has no business holding.
 *
 * `permissions` is already resolved — `super_admin` arrives holding the full
 * catalogue — so the client never has to special-case a role name.
 */
export type AdminSession = {
  id: string
  name: string
  email: string
  role: { id: number; name: string; label: string | null }
  permissions: AdminPermission[]
  lastLoginAt: string | null
}

export type UpdateAdminProfile = {
  body: { name: string; email: string }
  response: DataResponse<AdminSession>
}

export type UpdateAdminPassword = {
  body: { currentPassword: string; password: string; passwordConfirmation: string }
  response: MessageResponse
}

export type LoginAdmin = {
  body: { email: string; password: string }
  response: DataResponse<AdminSession>
}

export type LogoutAdmin = {
  response: MessageResponse
}

/** Resolves to `null` rather than 401 so the guard can redirect without an error. */
export type SessionAdmin = {
  response: DataResponse<AdminSession | null>
}
