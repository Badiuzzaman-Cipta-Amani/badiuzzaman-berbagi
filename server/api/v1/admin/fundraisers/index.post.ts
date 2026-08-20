import { adminFundraiserSchema } from "~~/shared/validation/admin"

export default eventHandler(async (event): Promise<CreateAdminFundraiser["response"]> => {
  const body = await readValidBody(event, adminFundraiserSchema)

  const fundraiser = await prisma.fundraiser.create({
    data: {
      name: body.name,
      description: body.description || null,
      googleMaps: body.googleMaps || null,
    },
    select: adminFundraiserSelect,
  })

  return {
    message: "Lembaga berhasil ditambahkan",
    data: serializeAdminFundraiser(fundraiser),
  }
})
