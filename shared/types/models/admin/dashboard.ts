import type { CampaignCategory, CampaignStatus } from "../../common"
import type { DataResponse } from "../../response"
import type { AdminDonationItem } from "./donation"

/**
 * Every figure the dashboard shows is computed server-side, so the cards, the
 * chart, and the tables can never disagree about the same period.
 */
export type AdminDashboardSummary = {
  /** Verified funds, all time. */
  totalRaised: number
  raisedThisMonth: number
  raisedLastMonth: number
  totalDonation: number
  donationThisMonth: number
  pendingDonation: number
  /** Money sitting in the verification queue. */
  pendingAmount: number
  totalCampaign: number
  activeCampaign: number
  totalUser: number
  newUserThisMonth: number
  totalFundraiser: number
}

/** One bucket per day, oldest first, with empty days filled in as zeroes. */
export type AdminDashboardTrendPoint = {
  date: string
  amount: number
  count: number
}

export type AdminDashboardCategory = {
  category: CampaignCategory
  campaignCount: number
  raised: number
}

export type AdminDashboardStatus = {
  status: CampaignStatus
  count: number
}

export type AdminDashboardCampaign = {
  slug: string
  title: string
  raisedAmount: number
  targetAmount: number
  progress: number
  totalDonor: number
}

export type AdminDashboard = {
  summary: AdminDashboardSummary
  trend: AdminDashboardTrendPoint[]
  categories: AdminDashboardCategory[]
  campaignStatus: AdminDashboardStatus[]
  topCampaigns: AdminDashboardCampaign[]
  recentDonations: AdminDonationItem[]
}

export type GetAdminDashboard = {
  query?: { days?: number }
  response: DataResponse<AdminDashboard>
}
