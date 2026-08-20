import { adminCampaignSchema } from "~~/shared/validation/admin"

export default eventHandler(async (event): Promise<CreateAdminCampaign["response"]> => {
  const body = await readValidBody(event, adminCampaignSchema)

  const slug = await uniqueCampaignSlug(body.slug || body.title)

  const campaign = await prisma.campaign.create({
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
      // A draft has not been vetted yet, so it carries no verification stamp.
      verifiedAt: body.status === "draft" ? null : new Date(),
      endAt: body.endAt ? new Date(body.endAt) : null,
      fundraiserId: body.fundraiserId ? BigInt(body.fundraiserId) : null,
    },
    select: { id: true },
  })

  await replaceCampaignImages(campaign.id, body.images ?? [])

  const created = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaign.id },
    select: adminCampaignDetailSelect,
  })

  return {
    message: "Campaign berhasil dibuat",
    data: serializeAdminCampaignDetail(created),
  }
})
