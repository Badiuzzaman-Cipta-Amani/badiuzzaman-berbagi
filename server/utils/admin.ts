import type { H3Event } from "h3"
import type { Prisma } from "~~/prisma/generated/client"

import * as v from "valibot"
import { SUPER_ADMIN_ROLE } from "~~/shared/constants/permission"

/**
 * Selects and serializers shared by more than one admin endpoint. As with the
 * public API, each handler still owns its own `where`/`orderBy`/pagination.
 */

/** BigInt ids arrive as strings; anything non-numeric is a 400, not a 500. */
export function parseIdParam(event: H3Event, name = "id"): bigint {
  const raw = getRouterParam(event, name)

  if (!raw || !/^\d+$/.test(raw)) {
    throw createError({ status: 400, statusMessage: `Parameter ${name} tidak valid` })
  }

  return BigInt(raw)
}

export function parseIntParam(event: H3Event, name = "id"): number {
  const raw = getRouterParam(event, name)
  const value = Number(raw)

  if (!raw || !Number.isInteger(value) || value < 1) {
    throw createError({ status: 400, statusMessage: `Parameter ${name} tidak valid` })
  }

  return value
}

/**
 * Body validation, once. Returns 422 with the same `errors` shape the public
 * endpoints use, so the client can bind issues back onto form fields.
 */
export async function readValidBody<TSchema extends v.GenericSchema>(
  event: H3Event,
  schema: TSchema,
): Promise<v.InferOutput<TSchema>> {
  const result = await readValidatedBody(event, (data) => v.safeParse(schema, data))

  if (!result.success) {
    throw createError({
      status: 422,
      statusMessage: result.issues[0]?.message ?? "Data tidak valid",
      data: { errors: v.flatten(result.issues).nested },
    })
  }

  return result.output
}

/* -------------------------------------------------------------------------- */
/* Donations                                                                   */
/* -------------------------------------------------------------------------- */

export const adminDonationSelect = {
  id: true,
  reference: true,
  donorName: true,
  donorNames: true,
  amount: true,
  message: true,
  status: true,
  isDuaHidden: true,
  reviewNote: true,
  createdAt: true,
  verifiedAt: true,
  proofUrl: true,
  proofNote: true,
  confirmedAt: true,
  campaign: { select: { id: true, slug: true, title: true } },
  user: { select: { id: true, name: true, email: true } },
  verifiedBy: { select: { id: true, name: true } },
} satisfies Prisma.DonationSelect

export const adminDonationDetailSelect = {
  ...adminDonationSelect,
  campaign: {
    select: {
      id: true,
      slug: true,
      title: true,
      targetAmount: true,
      raisedAmount: true,
    },
  },
} satisfies Prisma.DonationSelect

type AdminDonationRow = Prisma.DonationGetPayload<{ select: typeof adminDonationSelect }>
type AdminDonationDetailRow = Prisma.DonationGetPayload<{
  select: typeof adminDonationDetailSelect
}>

export function serializeAdminDonation(donation: AdminDonationRow): AdminDonationItem {
  const donorName = donation.donorName || "Hamba Allah"

  return {
    id: donation.id.toString(),
    reference: donation.reference,
    donorName,
    donorNames: donorRoster(donation.donorNames, donorName),
    amount: Number(donation.amount),
    message: donation.message,
    status: donation.status,
    isDuaHidden: donation.isDuaHidden,
    reviewNote: donation.reviewNote,
    createdAt: donation.createdAt.toISOString(),
    verifiedAt: donation.verifiedAt?.toISOString() ?? null,
    proofUrl: donation.proofUrl,
    proofNote: donation.proofNote,
    confirmedAt: donation.confirmedAt?.toISOString() ?? null,
    campaign: donation.campaign
      ? {
          id: donation.campaign.id.toString(),
          slug: donation.campaign.slug,
          title: donation.campaign.title,
        }
      : null,
    user: donation.user
      ? {
          id: donation.user.id.toString(),
          name: donation.user.name,
          email: donation.user.email,
        }
      : null,
    verifiedBy: donation.verifiedBy
      ? { id: donation.verifiedBy.id.toString(), name: donation.verifiedBy.name }
      : null,
  }
}

export function serializeAdminDonationDetail(
  donation: AdminDonationDetailRow,
): AdminDonationDetail {
  const campaign = donation.campaign

  return {
    ...serializeAdminDonation({ ...donation, campaign }),
    campaign: campaign
      ? {
          id: campaign.id.toString(),
          slug: campaign.slug,
          title: campaign.title,
          targetAmount: Number(campaign.targetAmount),
          raisedAmount: Number(campaign.raisedAmount),
          progress: campaignProgress(campaign.raisedAmount, campaign.targetAmount),
        }
      : null,
  }
}

/* -------------------------------------------------------------------------- */
/* Campaigns                                                                   */
/* -------------------------------------------------------------------------- */

export const adminCampaignSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  status: true,
  location: true,
  targetAmount: true,
  raisedAmount: true,
  endAt: true,
  verifiedAt: true,
  createdAt: true,
  fundraiser: { select: { id: true, name: true } },
  campaignAttachments: {
    select: { name: true, path: true, mime: true, alt: true },
    orderBy: { sortOrder: "asc" },
  },
  _count: { select: { donations: true } },
} satisfies Prisma.CampaignSelect

export const adminCampaignDetailSelect = {
  ...adminCampaignSelect,
  excerpt: true,
  description: true,
  mapsUrl: true,
} satisfies Prisma.CampaignSelect

type AdminCampaignRow = Prisma.CampaignGetPayload<{ select: typeof adminCampaignSelect }>
type AdminCampaignDetailRow = Prisma.CampaignGetPayload<{
  select: typeof adminCampaignDetailSelect
}>

/**
 * `pendingDonation` cannot come from the same `_count` as the total, so callers
 * count the queue separately and hand the number in.
 */
export function serializeAdminCampaign(
  campaign: AdminCampaignRow,
  pendingDonation = 0,
): AdminCampaignItem {
  const media = campaign.campaignAttachments.map(serializeAttachment)

  return {
    id: campaign.id.toString(),
    slug: campaign.slug,
    title: campaign.title,
    category: campaign.category,
    status: campaign.status,
    location: campaign.location,
    targetAmount: Number(campaign.targetAmount),
    raisedAmount: Number(campaign.raisedAmount),
    progress: campaignProgress(campaign.raisedAmount, campaign.targetAmount),
    totalDonor: campaign._count.donations,
    pendingDonation,
    endAt: campaign.endAt?.toISOString() ?? null,
    verifiedAt: campaign.verifiedAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    cover: media.find((item) => item.kind === "image") ?? null,
    fundraiser: campaign.fundraiser
      ? { id: campaign.fundraiser.id.toString(), name: campaign.fundraiser.name }
      : null,
  }
}

export function serializeAdminCampaignDetail(
  campaign: AdminCampaignDetailRow,
  pendingDonation = 0,
): AdminCampaignDetail {
  return {
    ...serializeAdminCampaign(campaign, pendingDonation),
    excerpt: campaign.excerpt,
    description: campaign.description,
    mapsUrl: campaign.mapsUrl,
    media: campaign.campaignAttachments.map(serializeAttachment),
  }
}

/** How many donations are awaiting verification, keyed by campaign id string. */
export async function countPendingDonations(campaignIds: bigint[]) {
  if (!campaignIds.length) return new Map<string, number>()

  const rows = await prisma.donation.groupBy({
    by: ["campaignId"],
    where: { campaignId: { in: campaignIds }, status: "pending" },
    _count: { _all: true },
  })

  return new Map(rows.map((row) => [row.campaignId.toString(), row._count._all]))
}

/**
 * Slugs are the public identifier, so a collision would silently repoint a live
 * URL. Suffix until free, ignoring the campaign being edited.
 */
export async function uniqueCampaignSlug(source: string, excludeId?: bigint) {
  const base =
    source
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "campaign"

  let slug = base
  let suffix = 1

  while (true) {
    const existing = await prisma.campaign.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing || (excludeId && existing.id === excludeId)) return slug

    suffix += 1
    slug = `${base}-${suffix}`
  }
}

/**
 * Artwork is referenced by absolute URL until an upload pipeline exists. The
 * attachment table splits path and name, so the whole URL goes in `path` and
 * `name` stays empty — `attachmentUrl()` already handles that shape.
 */
export async function replaceCampaignImages(campaignId: bigint, urls: string[]) {
  const cleaned = urls.map((url) => url.trim()).filter(Boolean)

  await prisma.campaignAttachment.deleteMany({ where: { campaignId } })

  if (!cleaned.length) return

  await prisma.campaignAttachment.createMany({
    data: cleaned.map((url, index) => ({
      campaignId,
      name: "",
      path: url,
      mime: "image/jpeg",
      size: 0,
      sortOrder: index,
    })),
  })
}

/* -------------------------------------------------------------------------- */
/* Users and admin accounts                                                    */
/* -------------------------------------------------------------------------- */

export const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  createdAt: true,
  _count: { select: { donations: true } },
  donations: { where: { status: "verified" }, select: { amount: true } },
} satisfies Prisma.UserSelect

type AdminUserRow = Prisma.UserGetPayload<{ select: typeof adminUserSelect }>

export function serializeAdminUser(user: AdminUserRow): AdminUserItem {
  return {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    totalDonation: user._count.donations,
    totalDonated: user.donations.reduce((sum, row) => sum + Number(row.amount), 0),
    createdAt: user.createdAt.toISOString(),
  }
}

/* -------------------------------------------------------------------------- */
/* Fundraisers and campaign updates                                            */
/* -------------------------------------------------------------------------- */

export const adminFundraiserSelect = {
  id: true,
  name: true,
  description: true,
  googleMaps: true,
  createdAt: true,
  campaigns: { select: { raisedAmount: true } },
} satisfies Prisma.FundraiserSelect

type AdminFundraiserRow = Prisma.FundraiserGetPayload<{
  select: typeof adminFundraiserSelect
}>

export function serializeAdminFundraiser(
  fundraiser: AdminFundraiserRow,
): AdminFundraiserItem {
  return {
    id: fundraiser.id.toString(),
    name: fundraiser.name,
    description: fundraiser.description,
    googleMaps: fundraiser.googleMaps,
    totalCampaign: fundraiser.campaigns.length,
    totalRaised: fundraiser.campaigns.reduce(
      (total, campaign) => total + Number(campaign.raisedAmount),
      0,
    ),
    createdAt: fundraiser.createdAt.toISOString(),
  }
}

export const adminUpdateSelect = {
  id: true,
  title: true,
  description: true,
  createdAt: true,
  campaign: { select: { id: true, slug: true, title: true } },
} satisfies Prisma.CampaignUpdateSelect

type AdminUpdateRow = Prisma.CampaignUpdateGetPayload<{
  select: typeof adminUpdateSelect
}>

export function serializeAdminCampaignUpdate(
  update: AdminUpdateRow,
): AdminCampaignUpdateItem {
  return {
    id: update.id.toString(),
    title: update.title,
    description: update.description,
    createdAt: update.createdAt.toISOString(),
    campaign: update.campaign
      ? {
          id: update.campaign.id.toString(),
          slug: update.campaign.slug,
          title: update.campaign.title,
        }
      : null,
  }
}

export const adminAccountSelect = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  role: { select: { id: true, name: true, label: true } },
} satisfies Prisma.AdminSelect

/* -------------------------------------------------------------------------- */
/* Roles                                                                       */
/* -------------------------------------------------------------------------- */

export const adminRoleSelect = {
  id: true,
  name: true,
  label: true,
  description: true,
  permissions: true,
  createdAt: true,
  _count: { select: { admins: true } },
} satisfies Prisma.RoleSelect

type AdminRoleRow = Prisma.RoleGetPayload<{ select: typeof adminRoleSelect }>

export function serializeAdminRole(role: AdminRoleRow): AdminRoleItem {
  return {
    id: role.id,
    name: role.name,
    label: role.label,
    description: role.description,
    // Resolved rather than stored, so `super_admin` always reads as complete.
    permissions: resolvePermissions(role),
    isSystem: role.name === SUPER_ADMIN_ROLE,
    totalAdmin: role._count.admins,
    createdAt: role.createdAt.toISOString(),
  }
}

type AdminAccountRow = Prisma.AdminGetPayload<{ select: typeof adminAccountSelect }>

export function serializeAdminAccount(admin: AdminAccountRow): AdminAccountItem {
  return {
    id: admin.id.toString(),
    name: admin.name,
    email: admin.email,
    isActive: admin.isActive,
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
    createdAt: admin.createdAt.toISOString(),
    role: admin.role,
  }
}
