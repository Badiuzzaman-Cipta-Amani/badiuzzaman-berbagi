import * as v from "valibot"

const visibilitySchema = v.object({ isDuaHidden: v.boolean() })

/** Hides the message only — the donation itself and its amount are untouched. */
export default eventHandler(async (event): Promise<ToggleAdminDua["response"]> => {
  const id = parseIdParam(event)
  const body = await readValidBody(event, visibilitySchema)

  const donation = await prisma.donation.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!donation) {
    throw createError({ status: 404, statusMessage: "Doa tidak ditemukan" })
  }

  await prisma.donation.update({
    where: { id },
    data: { isDuaHidden: body.isDuaHidden },
  })

  return {
    message: body.isDuaHidden ? "Doa disembunyikan" : "Doa ditampilkan kembali",
  }
})
