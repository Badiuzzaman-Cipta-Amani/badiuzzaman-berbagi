import * as v from "valibot"
import { CAMPAIGN_CATEGORIES, CAMPAIGN_STATUSES } from "~~/shared/constants/campaign"
import { ADMIN_PERMISSIONS } from "~~/shared/constants/permission"

/**
 * One schema per admin write, shared by the `UForm` that collects it and the
 * handler that persists it — so the form and the endpoint reject the same input.
 */

const requiredString = (message: string) =>
  v.pipe(v.string(), v.trim(), v.nonEmpty(message))

const optionalString = v.optional(v.pipe(v.string(), v.trim()), "")

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

/** Empty means "keep the stored hash", so only a typed value is length-checked. */
const optionalPassword = v.optional(
  v.union([
    v.literal(""),
    v.pipe(v.string(), v.minLength(8, "Kata sandi minimal 8 karakter")),
  ]),
  "",
)

const optionalUrl = v.optional(
  v.union([
    v.literal(""),
    v.pipe(v.string(), v.trim(), v.url("Format tautan tidak valid")),
  ]),
  "",
)

export const adminLoginSchema = v.object({
  email,
  password: v.pipe(v.string(), v.nonEmpty("Kata sandi wajib diisi")),
})

export const adminUserCreateSchema = v.object({
  name: requiredString("Nama wajib diisi"),
  email,
  phone: optionalString,
  password,
})

export const adminUserUpdateSchema = v.object({
  name: requiredString("Nama wajib diisi"),
  email,
  phone: optionalString,
  password: optionalPassword,
})

export const adminAccountCreateSchema = v.object({
  name: requiredString("Nama wajib diisi"),
  email,
  password,
  roleId: v.pipe(
    v.number("Peran wajib dipilih"),
    v.integer(),
    v.minValue(1, "Peran wajib dipilih"),
  ),
  isActive: v.optional(v.boolean(), true),
})

export const adminAccountUpdateSchema = v.object({
  name: requiredString("Nama wajib diisi"),
  email,
  password: optionalPassword,
  roleId: v.pipe(
    v.number("Peran wajib dipilih"),
    v.integer(),
    v.minValue(1, "Peran wajib dipilih"),
  ),
  isActive: v.optional(v.boolean(), true),
})

export const adminRoleSchema = v.object({
  /**
   * The machine key the guard matches on, so it is constrained to the shape the
   * rest of the system assumes: lowercase, digits, and underscores.
   */
  name: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Kunci peran wajib diisi"),
    v.maxLength(40, "Kunci peran maksimal 40 karakter"),
    v.regex(
      /^[a-z][a-z0-9_]*$/,
      "Gunakan huruf kecil, angka, dan garis bawah — misalnya content_editor",
    ),
  ),
  label: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Nama tampilan wajib diisi"),
    v.maxLength(60, "Nama tampilan maksimal 60 karakter"),
  ),
  description: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(200)), ""),
  permissions: v.optional(v.array(v.picklist(ADMIN_PERMISSIONS)), []),
})

export const adminFundraiserSchema = v.object({
  name: requiredString("Nama lembaga wajib diisi"),
  googleMaps: optionalUrl,
  description: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(500, "Deskripsi maksimal 500 karakter")),
    "",
  ),
})

/** The signed-in admin editing their own details — no role field, on purpose. */
export const adminProfileSchema = v.object({
  name: requiredString("Nama wajib diisi"),
  email,
})

export const adminPasswordSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(v.string(), v.nonEmpty("Kata sandi saat ini wajib diisi")),
    password,
    passwordConfirmation: v.pipe(v.string(), v.nonEmpty("Konfirmasi wajib diisi")),
  }),
  v.forward(
    v.partialCheck(
      [["password"], ["passwordConfirmation"]],
      (input) => input.password === input.passwordConfirmation,
      "Konfirmasi kata sandi tidak cocok",
    ),
    ["passwordConfirmation"],
  ),
)

export const adminCampaignUpdateSchema = v.object({
  campaignId: requiredString("Campaign wajib dipilih"),
  title: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Judul wajib diisi"),
    v.maxLength(120, "Judul maksimal 120 karakter"),
  ),
  description: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Isi kabar wajib diisi"),
    v.minLength(20, "Isi kabar minimal 20 karakter"),
  ),
})

export const adminCampaignSchema = v.object({
  title: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Judul campaign wajib diisi"),
    v.maxLength(100, "Judul maksimal 100 karakter"),
  ),
  slug: v.optional(
    v.union([
      v.literal(""),
      v.pipe(
        v.string(),
        v.trim(),
        v.regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung",
        ),
      ),
    ]),
    "",
  ),
  category: v.picklist(CAMPAIGN_CATEGORIES, "Kategori wajib dipilih"),
  excerpt: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Ringkasan wajib diisi"),
    v.maxLength(200, "Ringkasan maksimal 200 karakter"),
  ),
  description: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Deskripsi wajib diisi"),
    v.minLength(40, "Deskripsi minimal 40 karakter"),
  ),
  location: optionalString,
  mapsUrl: optionalUrl,
  targetAmount: v.pipe(
    v.number("Target donasi wajib diisi"),
    v.minValue(100_000, "Target donasi minimal Rp100.000"),
  ),
  status: v.picklist(CAMPAIGN_STATUSES, "Status wajib dipilih"),
  endAt: v.optional(v.nullable(v.string()), null),
  fundraiserId: v.optional(v.nullable(v.string()), null),
  images: v.optional(v.array(v.pipe(v.string(), v.trim())), []),
})

export const adminDonationVerifySchema = v.object({
  status: v.picklist(["verified", "rejected"] as const, "Status wajib dipilih"),
  reviewNote: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(200)), ""),
})

export type AdminLoginInput = v.InferOutput<typeof adminLoginSchema>
export type AdminUserCreateInput = v.InferOutput<typeof adminUserCreateSchema>
export type AdminUserUpdateInput = v.InferOutput<typeof adminUserUpdateSchema>
export type AdminAccountCreateInput = v.InferOutput<typeof adminAccountCreateSchema>
export type AdminAccountUpdateInput = v.InferOutput<typeof adminAccountUpdateSchema>
export type AdminRoleInput = v.InferOutput<typeof adminRoleSchema>
export type AdminProfileInput = v.InferOutput<typeof adminProfileSchema>
export type AdminPasswordInput = v.InferOutput<typeof adminPasswordSchema>
export type AdminFundraiserInput = v.InferOutput<typeof adminFundraiserSchema>
export type AdminCampaignInput = v.InferOutput<typeof adminCampaignSchema>
export type AdminCampaignUpdateInput = v.InferOutput<typeof adminCampaignUpdateSchema>
export type AdminDonationVerifyInput = v.InferOutput<typeof adminDonationVerifySchema>
