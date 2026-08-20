import { adminFundraiserSchema } from "~~/shared/validation/admin"

export default eventHandler(async (event): Promise<UpdateAdminFundraiser["response"]> => {
  const id = parseIdParam(event)
  const body = await readValidBody(event, adminFundraiserSchema)

  const existing = await prisma.fundraiser.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    throw createError({ status: 404, statusMessage: "Lembaga tidak ditemukan" })
  }

  const fundraiser = await prisma.fundraiser.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description || null,
      googleMaps: body.googleMaps || null,
    },
    select: adminFundraiserSelect,
  })

  return {
    message: "Lembaga berhasil diperbarui",
    data: serializeAdminFundraiser(fundraiser),
  }
})
