import { adminCampaignUpdateSchema } from "~~/shared/validation/admin"

export default eventHandler(
  async (event): Promise<UpdateAdminCampaignUpdate["response"]> => {
    const id = parseIdParam(event)
    const body = await readValidBody(event, adminCampaignUpdateSchema)

    const existing = await prisma.campaignUpdate.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      throw createError({ status: 404, statusMessage: "Kabar tidak ditemukan" })
    }

    if (!/^\d+$/.test(body.campaignId)) {
      throw createError({ status: 422, statusMessage: "Campaign tidak valid" })
    }

    const update = await prisma.campaignUpdate.update({
      where: { id },
      data: {
        campaignId: BigInt(body.campaignId),
        title: body.title,
        description: body.description,
      },
      select: adminUpdateSelect,
    })

    return {
      message: "Kabar berhasil diperbarui",
      data: serializeAdminCampaignUpdate(update),
    }
  },
)
