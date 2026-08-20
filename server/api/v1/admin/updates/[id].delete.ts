export default eventHandler(
  async (event): Promise<DeleteAdminCampaignUpdate["response"]> => {
    const id = parseIdParam(event)

    const update = await prisma.campaignUpdate.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!update) {
      throw createError({ status: 404, statusMessage: "Kabar tidak ditemukan" })
    }

    await prisma.campaignUpdate.delete({ where: { id } })

    return { message: "Kabar berhasil dihapus" }
  },
)
