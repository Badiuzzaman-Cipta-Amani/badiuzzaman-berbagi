import type { BadgeProps } from "@nuxt/ui"

/**
 * Presentation for the two status enums. Colours follow the meanings fixed in
 * `app.config.ts`: emerald is "verified / target met", amber is "waiting",
 * red is "refused or out of time".
 */

type StatusPresentation = {
  label: string
  color: BadgeProps["color"]
  icon: string
}

export const campaignStatuses: Record<CampaignStatus, StatusPresentation> = {
  draft: {
    label: "Draf",
    color: "neutral",
    icon: "i-material-symbols-edit-document-rounded",
  },
  active: {
    label: "Aktif",
    color: "success",
    icon: "i-material-symbols-play-circle-rounded",
  },
  completed: {
    label: "Selesai",
    color: "info",
    icon: "i-material-symbols-flag-circle-rounded",
  },
  cancelled: {
    label: "Dibatalkan",
    color: "error",
    icon: "i-material-symbols-cancel-rounded",
  },
}

export const donationStatuses: Record<DonationStatus, StatusPresentation> = {
  pending: {
    label: "Menunggu",
    color: "warning",
    icon: "i-material-symbols-hourglass-top-rounded",
  },
  verified: {
    label: "Terverifikasi",
    color: "success",
    icon: "i-material-symbols-verified-rounded",
  },
  rejected: {
    label: "Ditolak",
    color: "error",
    icon: "i-material-symbols-block-rounded",
  },
}

export const campaignStatusOptions = (
  Object.keys(campaignStatuses) as CampaignStatus[]
).map((value) => ({ label: campaignStatuses[value].label, value }))

export const donationStatusOptions = (
  Object.keys(donationStatuses) as DonationStatus[]
).map((value) => ({ label: donationStatuses[value].label, value }))
