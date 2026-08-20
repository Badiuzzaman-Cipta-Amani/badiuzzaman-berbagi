import * as v from "valibot"

/**
 * Shared by the donor auth forms and `server/api/v1/auth/*`, so the form and the
 * endpoint reject exactly the same input.
 */

const email = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Email wajib diisi"),
  v.email("Format email tidak valid"),
)

const password = v.pipe(
  v.string(),
  v.nonEmpty("Kata sandi wajib diisi"),
  v.minLength(8, "Kata sandi minimal 8 karakter"),
)

/** Optional everywhere: a donor can give without ever leaving a number. */
const phone = v.optional(
  v.pipe(
    v.string(),
    v.trim(),
    v.regex(/^$|^[0-9+][0-9\s-]{7,19}$/, "Format nomor telepon tidak valid"),
  ),
  "",
)

export const loginSchema = v.object({
  email,
  password: v.pipe(v.string(), v.nonEmpty("Kata sandi wajib diisi")),
})

/**
 * `confirmPassword` is checked with `forward` so the mismatch lands on the field
 * the donor has to retype, not on the form as a whole.
 */
export const registerSchema = v.pipe(
  v.object({
    name: v.pipe(v.string(), v.trim(), v.nonEmpty("Nama lengkap wajib diisi")),
    email,
    phone,
    password,
    confirmPassword: v.pipe(v.string(), v.nonEmpty("Ulangi kata sandi Anda")),
  }),
  v.forward(
    v.partialCheck(
      [["password"], ["confirmPassword"]],
      (input) => input.password === input.confirmPassword,
      "Kata sandi tidak cocok",
    ),
    ["confirmPassword"],
  ),
)

export const forgotPasswordSchema = v.object({ email })

export const resetPasswordSchema = v.pipe(
  v.object({
    token: v.pipe(v.string(), v.nonEmpty("Tautan atur ulang tidak valid")),
    password,
    confirmPassword: v.pipe(v.string(), v.nonEmpty("Ulangi kata sandi Anda")),
  }),
  v.forward(
    v.partialCheck(
      [["password"], ["confirmPassword"]],
      (input) => input.password === input.confirmPassword,
      "Kata sandi tidak cocok",
    ),
    ["confirmPassword"],
  ),
)

export const userProfileSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.nonEmpty("Nama lengkap wajib diisi")),
  email,
  phone,
})

export const userPasswordSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(v.string(), v.nonEmpty("Kata sandi saat ini wajib diisi")),
    password,
    confirmPassword: v.pipe(v.string(), v.nonEmpty("Ulangi kata sandi baru Anda")),
  }),
  v.forward(
    v.partialCheck(
      [["password"], ["confirmPassword"]],
      (input) => input.password === input.confirmPassword,
      "Kata sandi tidak cocok",
    ),
    ["confirmPassword"],
  ),
)

export type LoginInput = v.InferOutput<typeof loginSchema>
export type RegisterInput = v.InferOutput<typeof registerSchema>
export type ForgotPasswordInput = v.InferOutput<typeof forgotPasswordSchema>
export type ResetPasswordInput = v.InferOutput<typeof resetPasswordSchema>
export type UserProfileInput = v.InferOutput<typeof userProfileSchema>
export type UserPasswordInput = v.InferOutput<typeof userPasswordSchema>
