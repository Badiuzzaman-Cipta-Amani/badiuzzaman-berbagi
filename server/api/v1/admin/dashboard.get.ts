import { CAMPAIGN_STATUSES } from "~~/shared/constants/campaign"

const DEFAULT_TREND_DAYS = 30
const MAX_TREND_DAYS = 90

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function startOfMonth(offset = 0) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + offset, 1)
}

/** `Number(null)` is 0, but being explicit keeps a missing aggregate from reading as a real zero by accident. */
const sum = (value: bigint | null | undefined) =>
  value === null || value === undefined ? 0 : Number(value)

export default eventHandler(async (event): Promise<GetAdminDashboard["response"]> => {
  const query = getQuery(event)
  const days = Math.min(
    MAX_TREND_DAYS,
    Math.max(7, Number(query.days) || DEFAULT_TREND_DAYS),
  )

  const trendStart = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000))
  const thisMonth = startOfMonth()
  const lastMonth = startOfMonth(-1)

  const verified = { status: "verified" } as const

  const [
    verifiedTotal,
    thisMonthTotal,
    lastMonthTotal,
    pendingTotal,
    totalDonation,
    donationThisMonth,
    totalCampaign,
    activeCampaign,
    totalUser,
    newUserThisMonth,
    totalFundraiser,
    campaignStatusRows,
    categoryRows,
    trendRows,
    topCampaignRows,
    recentDonationRows,
  ] = await Promise.all([
    prisma.donation.aggregate({ where: verified, _sum: { amount: true } }),
    prisma.donation.aggregate({
      where: { ...verified, verifiedAt: { gte: thisMonth } },
      _sum: { amount: true },
    }),
    prisma.donation.aggregate({
      where: { ...verified, verifiedAt: { gte: lastMonth, lt: thisMonth } },
      _sum: { amount: true },
    }),
    prisma.donation.aggregate({
      where: { status: "pending" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.donation.count(),
    prisma.donation.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: "active" } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.fundraiser.count(),
    prisma.campaign.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.campaign.groupBy({
      by: ["category"],
      _count: { _all: true },
      _sum: { raisedAmount: true },
    }),
    prisma.donation.findMany({
      where: { ...verified, verifiedAt: { gte: trendStart } },
      select: { amount: true, verifiedAt: true },
    }),
    prisma.campaign.findMany({
      where: { status: { in: ["active", "completed"] } },
      orderBy: { raisedAmount: "desc" },
      take: 5,
      select: {
        slug: true,
        title: true,
        raisedAmount: true,
        targetAmount: true,
        _count: { select: { donations: true } },
      },
    }),
    prisma.donation.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: adminDonationSelect,
    }),
  ])

  // Bucket by day in memory: the series is at most 90 rows wide and this keeps
  // every empty day present, which `groupBy` on a timestamp column would drop.
  const buckets = new Map<string, { amount: number; count: number }>()

  for (let index = 0; index < days; index++) {
    const date = new Date(trendStart)
    date.setDate(date.getDate() + index)
    buckets.set(date.toISOString().slice(0, 10), { amount: 0, count: 0 })
  }

  for (const row of trendRows) {
    if (!row.verifiedAt) continue

    const key = startOfDay(row.verifiedAt).toISOString().slice(0, 10)
    const bucket = buckets.get(key)

    if (!bucket) continue

    bucket.amount += Number(row.amount)
    bucket.count += 1
  }

  return {
    message: "Success",
    data: {
      summary: {
        totalRaised: sum(verifiedTotal._sum.amount),
        raisedThisMonth: sum(thisMonthTotal._sum.amount),
        raisedLastMonth: sum(lastMonthTotal._sum.amount),
        totalDonation,
        donationThisMonth,
        pendingDonation: pendingTotal._count._all,
        pendingAmount: sum(pendingTotal._sum.amount),
        totalCampaign,
        activeCampaign,
        totalUser,
        newUserThisMonth,
        totalFundraiser,
      },
      trend: [...buckets].map(([date, bucket]) => ({ date, ...bucket })),
      categories: categoryRows.map((row) => ({
        category: row.category,
        campaignCount: row._count._all,
        raised: sum(row._sum.raisedAmount),
      })),
      // Every status, including the ones with no rows: a donut that silently
      // drops "Dibatalkan" reads as "there are none" only by accident.
      campaignStatus: CAMPAIGN_STATUSES.map((status) => ({
        status,
        count: campaignStatusRows.find((row) => row.status === status)?._count._all ?? 0,
      })),
      topCampaigns: topCampaignRows.map((row) => ({
        slug: row.slug,
        title: row.title,
        raisedAmount: Number(row.raisedAmount),
        targetAmount: Number(row.targetAmount),
        progress: campaignProgress(row.raisedAmount, row.targetAmount),
        totalDonor: row._count.donations,
      })),
      recentDonations: recentDonationRows.map(serializeAdminDonation),
    },
  }
})
