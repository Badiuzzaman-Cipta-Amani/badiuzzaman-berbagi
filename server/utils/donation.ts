import type { Prisma } from "~~/prisma/generated/client"

import { randomInt } from "node:crypto"

/**
 * The donor-facing half of a donation. The admin serializers in `admin.ts` show
 * the audit trail; this shows only what the person who gave the money is
 * entitled to see, and it is addressed by `reference` rather than by `id`.
 */

/**
 * `I`, `O`, `0`, and `1` are left out: the reference gets read aloud over the
 * phone and dictated into WhatsApp, and those four are where that goes wrong.
 */
const REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
const REFERENCE_LENGTH = 6
const MAX_ATTEMPTS = 10

function randomReference() {
  let code = ""
  for (let index = 0; index < REFERENCE_LENGTH; index += 1) {
    code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)]
  }
  return `BZ-${code}`
}

/**
 * A short code no one else holds. The column is unique, so a collision would be
 * a failed insert rather than a silent overwrite — retrying a handful of times
 * is cheaper than widening the code past what a person will retype.
 */
export async function generateDonationReference() {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const reference = randomReference()

    const taken = await prisma.donation.findUnique({
      where: { reference },
      select: { id: true },
    })

    if (!taken) return reference
  }

  throw createError({
    status: 500,
    statusMessage: "Gagal membuat kode donasi. Silakan coba lagi.",
  })
}

/**
 * The one place the roster collapses into the string the feeds and the searches
 * read, so `donorName` can never drift from `donorNames`.
 */
export function joinDonorNames(names: string[]) {
  return names.join(", ")
}

/**
 * Rows written before the roster column existed carry only `donorName`, so a
 * one-name roster is reconstructed rather than served as an empty list.
 */
export function donorRoster(names: string[], fallback: string) {
  return names.length ? names : [fallback]
}

export const donationReceiptSelect = {
  reference: true,
  donorName: true,
  donorNames: true,
  amount: true,
  message: true,
  status: true,
  createdAt: true,
  confirmedAt: true,
  verifiedAt: true,
  reviewNote: true,
  proofUrl: true,
  proofNote: true,
  campaign: {
    select: {
      slug: true,
      title: true,
      campaignAttachments: {
        select: { name: true, path: true, mime: true, alt: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  },
} satisfies Prisma.DonationSelect

type DonationReceiptRow = Prisma.DonationGetPayload<{
  select: typeof donationReceiptSelect
}>

export function serializeDonationReceipt(donation: DonationReceiptRow): DonationReceipt {
  const campaign = donation.campaign
  const donorName = donation.donorName || "Hamba Allah"

  return {
    reference: donation.reference,
    donorName,
    donorNames: donorRoster(donation.donorNames, donorName),
    amount: Number(donation.amount),
    message: donation.message,
    status: donation.status,
    createdAt: donation.createdAt.toISOString(),
    confirmedAt: donation.confirmedAt?.toISOString() ?? null,
    verifiedAt: donation.verifiedAt?.toISOString() ?? null,
    reviewNote: donation.reviewNote,
    proofUrl: donation.proofUrl,
    proofNote: donation.proofNote,
    campaign: campaign
      ? {
          slug: campaign.slug,
          title: campaign.title,
          cover:
            campaign.campaignAttachments
              .map(serializeAttachment)
              .find((item) => item.kind === "image") ?? null,
        }
      : null,
  }
}

/** Normalises what the donor typed before it reaches the unique index. */
export function normalizeReference(raw: string | undefined) {
  const reference = (raw ?? "").trim().toUpperCase()

  if (!/^BZ-[0-9A-Z]{6}$/.test(reference)) {
    throw createError({ status: 400, statusMessage: "Kode donasi tidak dikenali" })
  }

  return reference
}
