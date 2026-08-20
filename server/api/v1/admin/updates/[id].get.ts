/** One kabar, for the edit page. */
export default eventHandler(
  async (event): Promise<DetailAdminCampaignUpdate["response"]> => {
    const id = parseIdParam(event)

    const update = await prisma.campaignUpdate.findUnique({
      where: { id },
      select: adminUpdateSelect,
    })

    if (!update) {
      throw createError({ status: 404, statusMessage: "Kabar tidak ditemukan" })
    }

    return { message: "Success", data: serializeAdminCampaignUpdate(update) }
  },
)
