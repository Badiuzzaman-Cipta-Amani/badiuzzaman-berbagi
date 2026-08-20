import type { AdminPermission } from "~~/shared/constants/permission"

export type AdminNavItem = {
  label: string
  to: string
  icon: string
  /** Nested routes still light up the parent entry; the dashboard matches exactly. */
  exact?: boolean
  /**
   * Hidden unless the admin holds at least one of these. Omitted means the
   * entry is available to anyone signed in.
   */
  anyOf?: AdminPermission[]
}

export type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

/**
 * The back-office menu, in the order the work happens: look at the numbers,
 * then the money waiting on a decision, then the content behind it, then who is
 * allowed in.
 *
 * Icons stay within the vocabulary of the foundation's work — the mosque, the
 * open Qur'an, the giving hand, the crescent — rather than the generic office
 * furniture the set started with.
 */
export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Ringkasan",
    items: [
      {
        label: "Dashboard",
        to: "/admin",
        icon: "i-material-symbols-dashboard-rounded",
        exact: true,
        anyOf: ["dashboard.view"],
      },
    ],
  },
  {
    label: "Operasional",
    items: [
      {
        label: "Donasi",
        to: "/admin/donasi",
        icon: "i-material-symbols-volunteer-activism-rounded",
        anyOf: ["donation.view", "donation.verify"],
      },
      {
        label: "Campaign",
        to: "/admin/campaign",
        icon: "i-material-symbols-mosque-rounded",
        anyOf: ["campaign.view", "campaign.manage"],
      },
      {
        label: "Kabar Terbaru",
        to: "/admin/kabar",
        icon: "i-material-symbols-menu-book-rounded",
        anyOf: ["update.view", "update.manage"],
      },
      {
        label: "Doa Donatur",
        to: "/admin/doa",
        icon: "i-material-symbols-favorite-rounded",
        anyOf: ["dua.view", "dua.moderate"],
      },
    ],
  },
  {
    label: "Data Master",
    items: [
      {
        label: "Donatur",
        to: "/admin/donatur",
        icon: "i-material-symbols-diversity-3-rounded",
        anyOf: ["user.view", "user.manage"],
      },
      {
        label: "Lembaga",
        to: "/admin/lembaga",
        icon: "i-material-symbols-account-balance-rounded",
        anyOf: ["fundraiser.view", "fundraiser.manage"],
      },
    ],
  },
  {
    label: "Manajemen Admin",
    items: [
      {
        label: "Akun Admin",
        to: "/admin/pengguna",
        icon: "i-material-symbols-shield-person-rounded",
        anyOf: ["admin.manage"],
      },
      {
        label: "Peran & Izin",
        to: "/admin/peran",
        icon: "i-material-symbols-lock-person-rounded",
        anyOf: ["role.manage"],
      },
    ],
  },
]

/**
 * The admin's own account is not navigation — it is the account you are already
 * signed in as, so it lives in the footer identity menu rather than as a fourth
 * entry under "Manajemen Admin". It stays listed here (outside `adminNavGroups`)
 * because the route guard still has to recognise `/admin/profil` as a page every
 * signed-in admin may open.
 */
export const adminProfileNavItem: AdminNavItem = {
  label: "Profil Saya",
  to: "/admin/profil",
  icon: "i-material-symbols-badge-rounded",
}
