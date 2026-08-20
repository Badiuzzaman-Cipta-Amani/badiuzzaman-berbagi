import type { DataResponse, MessageResponse } from "../response"

/**
 * The donor session. Deliberately separate from `AdminSession`: a `User` and an
 * `Admin` are unrelated tables with unrelated cookies, and nothing about one
 * grants anything about the other.
 *
 * The totals ride along because every screen that shows the donor also shows
 * what they have given — computing them client-side would need the whole
 * donation history just to render a header.
 */
export type AuthUser = {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  totalDonation: number
  /** Sum of this donor's **verified** donations only. */
  totalDonated: number
}

/**
 * Answers `data: null` rather than 401 for a signed-out visitor, so the boot
 * check can decide where to route without tripping the global 401 redirect.
 */
export type SessionUser = {
  response: DataResponse<AuthUser | null>
}

export type LoginUser = {
  body: { email: string; password: string }
  response: DataResponse<AuthUser>
}

export type RegisterUser = {
  body: {
    name: string
    email: string
    phone?: string
    password: string
    confirmPassword: string
  }
  response: DataResponse<AuthUser>
}

export type LogoutUser = {
  response: MessageResponse
}

/**
 * There is no mail transport wired up yet. Rather than pretend an email was
 * sent, the endpoint hands the reset link straight back and the page says so —
 * `resetUrl` is `null` once a mailer exists and the link is delivered instead.
 *
 * The response never reveals whether the address is registered; an unknown
 * email gets the same shape with a `null` link.
 */
export type ForgotPasswordUser = {
  body: { email: string }
  response: DataResponse<{ resetUrl: string | null }>
}

export type ResetPasswordUser = {
  body: { token: string; password: string; confirmPassword: string }
  response: MessageResponse
}

export type UpdateUserProfile = {
  body: { name: string; email: string; phone?: string }
  response: DataResponse<AuthUser>
}

export type UpdateUserPassword = {
  body: { currentPassword: string; password: string; confirmPassword: string }
  response: MessageResponse
}
