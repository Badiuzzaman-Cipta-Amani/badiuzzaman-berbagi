/** Unpaginated, for the campaign form's fundraiser picker. */
export default eventHandler(async (): Promise<ListAdminFundraiser["response"]> => {
  const rows = await prisma.fundraiser.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  return {
    message: "Success",
    data: rows.map((row) => ({ id: row.id.toString(), name: row.name })),
  }
})
