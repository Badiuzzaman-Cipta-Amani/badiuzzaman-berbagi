/**
 * What an admin role is allowed to do.
 *
 * The catalogue lives in code, not in the database, because every key here is
 * enforced by a specific handler — a permission row nothing checks would be a
 * lie told to whoever grants it. `Role.permissions` stores a subset of these
 * keys; anything stored that is not in this list is ignored on read.
 *
 * `super_admin` is not in the data at all: it holds every permission by
 * definition, so it can never revoke its own access to the screen that edits
 * permissions and lock the back office.
 */

export const SUPER_ADMIN_ROLE = "super_admin"

export const ADMIN_PERMISSIONS = [
  "dashboard.view",
  "donation.view",
  "donation.verify",
  "campaign.view",
  "campaign.manage",
  "update.view",
  "update.manage",
  "dua.view",
  "dua.moderate",
  "user.view",
  "user.manage",
  "fundraiser.view",
  "fundraiser.manage",
  "admin.manage",
  "role.manage",
] as const

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number]

const PERMISSION_SET = new Set<string>(ADMIN_PERMISSIONS)

export const isAdminPermission = (value: unknown): value is AdminPermission =>
  typeof value === "string" && PERMISSION_SET.has(value)

/** Drops anything the catalogue no longer recognises, e.g. a renamed key. */
export const sanitizePermissions = (values: unknown): AdminPermission[] =>
  Array.isArray(values) ? [...new Set(values.filter(isAdminPermission))] : []

/**
 * Presentation for the role editor, grouped the way the menu is. `view` gates
 * the menu entry; the second key in each group gates the writes behind it.
 */
export const ADMIN_PERMISSION_GROUPS: {
  label: string
  items: { value: AdminPermission; label: string; description: string }[]
}[] = [
  {
    label: "Ringkasan",
    items: [
      {
        value: "dashboard.view",
        label: "Lihat dashboard",
        description: "Membuka ringkasan statistik dan grafik donasi.",
      },
    ],
  },
  {
    label: "Donasi",
    items: [
      {
        value: "donation.view",
        label: "Lihat donasi",
        description: "Membuka daftar dan detail donasi yang masuk.",
      },
      {
        value: "donation.verify",
        label: "Verifikasi donasi",
        description: "Menyetujui atau menolak donasi, yang mengubah dana terkumpul.",
      },
    ],
  },
  {
    label: "Campaign",
    items: [
      {
        value: "campaign.view",
        label: "Lihat campaign",
        description: "Membuka daftar campaign.",
      },
      {
        value: "campaign.manage",
        label: "Kelola campaign",
        description: "Membuat, mengubah, dan menghapus campaign.",
      },
    ],
  },
  {
    label: "Kabar terbaru",
    items: [
      {
        value: "update.view",
        label: "Lihat kabar",
        description: "Membuka daftar kabar perkembangan campaign.",
      },
      {
        value: "update.manage",
        label: "Kelola kabar",
        description: "Menulis, mengubah, dan menghapus kabar.",
      },
    ],
  },
  {
    label: "Doa donatur",
    items: [
      {
        value: "dua.view",
        label: "Lihat doa",
        description: "Membuka daftar doa yang ditulis donatur.",
      },
      {
        value: "dua.moderate",
        label: "Moderasi doa",
        description: "Menyembunyikan atau menampilkan kembali doa donatur.",
      },
    ],
  },
  {
    label: "Donatur",
    items: [
      {
        value: "user.view",
        label: "Lihat donatur",
        description: "Membuka daftar dan detail akun donatur.",
      },
      {
        value: "user.manage",
        label: "Kelola donatur",
        description: "Menambah, mengubah, dan menghapus akun donatur.",
      },
    ],
  },
  {
    label: "Lembaga",
    items: [
      {
        value: "fundraiser.view",
        label: "Lihat lembaga",
        description: "Membuka daftar lembaga penggalang.",
      },
      {
        value: "fundraiser.manage",
        label: "Kelola lembaga",
        description: "Menambah, mengubah, dan menghapus lembaga.",
      },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      {
        value: "admin.manage",
        label: "Kelola admin",
        description: "Menambah dan menonaktifkan akun admin, serta menetapkan perannya.",
      },
      {
        value: "role.manage",
        label: "Kelola peran",
        description: "Membuat peran dan menentukan izin yang dibawanya.",
      },
    ],
  },
]

/**
 * Fallback display name for a role saved before `label` existed:
 * `content_editor` reads as "Content Editor" rather than raw snake_case.
 */
export const humanizeRoleName = (name: string) =>
  name
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
