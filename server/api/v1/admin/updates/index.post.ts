import { adminCampaignUpdateSchema } from "~~/shared/validation/admin"

export default eventHandler(
  async (event): Promise<CreateAdminCampaignUpdate["response"]> => {
    const body = await readValidBody(event, adminCampaignUpdateSchema)

    if (!/^\d+$/.test(body.campaignId)) {
      throw createError({ status: 422, statusMessage: "Campaign tidak valid" })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: BigInt(body.campaignId) },
      select: { id: true },
    })

    if (!campaign) {
      throw createError({ status: 404, statusMessage: "Campaign tidak ditemukan" })
    }

    const update = await prisma.campaignUpdate.create({
      data: {
        campaignId: campaign.id,
        title: body.title,
        description: body.description,
      },
      select: adminUpdateSelect,
    })

    return {
      message: "Kabar terbaru berhasil dipublikasikan",
      data: serializeAdminCampaignUpdate(update),
    }
  },
)
