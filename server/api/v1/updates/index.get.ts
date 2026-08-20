export default eventHandler(async (event): Promise<ListUpdate["response"]> => {
  const query = getQuery(event)

  const updates = await prisma.campaignUpdate.findMany({
    orderBy: { createdAt: "desc" },
    take: normalizeSize(query.size),
    select: updateSelect,
  })

  return {
    message: "Success",
    data: updates.map(serializeUpdate),
  }
})
