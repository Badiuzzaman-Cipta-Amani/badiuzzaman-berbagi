import { adminCampaignSchema } from "~~/shared/validation/admin"

export default eventHandler(async (event): Promise<UpdateAdminCampaign["response"]> => {
  const id = parseIdParam(event)
  const body = await readValidBody(event, adminCampaignSchema)

  const existing = await prisma.campaign.findUnique({
    where: { id },
    select: { id: true, slug: true, status: true, verifiedAt: true },
  })

  if (!existing) {
    throw createError({ status: 404, statusMessage: "Campaign tidak ditemukan" })
  }

  // Only recompute the slug when the admin actually typed a different one —
  // silently repointing a live URL would break every link already shared.
  const slug =
    body.slug && body.slug !== existing.slug
      ? await uniqueCampaignSlug(body.slug, id)
      : existing.slug

  const leavingDraft = existing.status === "draft" && body.status !== "draft"

  await prisma.campaign.update({
    where: { id },
    data: {
      title: body.title,
      slug,
      category: body.category,
      excerpt: body.excerpt,
      description: body.description,
      location: body.location || null,
      mapsUrl: body.mapsUrl || null,
      targetAmount: BigInt(Math.trunc(body.targetAmount)),
      status: body.status,
      verifiedAt: leavingDraft ? new Date() : existing.verifiedAt,
      endAt: body.endAt ? new Date(body.endAt) : null,
      fundraiserId: body.fundraiserId ? BigInt(body.fundraiserId) : null,
    },
  })

  if (body.images) await replaceCampaignImages(id, body.images)

  const [updated, pending] = await Promise.all([
    prisma.campaign.findUniqueOrThrow({
      where: { id },
      select: adminCampaignDetailSelect,
    }),
    countPendingDonations([id]),
  ])

  return {
    message: "Campaign berhasil diperbarui",
    data: serializeAdminCampaignDetail(updated, pending.get(id.toString()) ?? 0),
  }
})
