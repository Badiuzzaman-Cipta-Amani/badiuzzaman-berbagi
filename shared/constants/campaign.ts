/**
 * Runtime constants live here rather than in `shared/types/**`, which is
 * registered for type auto-import only — values placed there resolve at
 * typecheck but are undefined inside the Nitro bundle. Import these by path.
 */

import {
  CampaignCategory,
  CampaignStatus,
  DonationStatus,
} from "~~/prisma/generated/enums"

/**
 * Runtime lists of the Prisma enums, derived from the generated objects so a
 * schema change cannot leave a hand-written copy behind. Valibot needs values,
 * not the type-only re-exports in `shared/types/common.ts`.
 */
export const CAMPAIGN_CATEGORIES = Object.values(CampaignCategory)
export const CAMPAIGN_STATUSES = Object.values(CampaignStatus)
export const DONATION_STATUSES = Object.values(DonationStatus)

export const CAMPAIGN_SORT_OPTIONS = [
  "latest",
  "oldest",
  "urgent",
  "popular",
  "almost_reach",
  "highest_nominal",
] as const

/** A campaign counts as urgent when it ends within this many days. */
export const CAMPAIGN_URGENT_DAYS = 15
