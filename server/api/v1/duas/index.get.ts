export default eventHandler(async (event): Promise<ListDua["response"]> => {
  const query = getQuery(event)

  const duas = await prisma.donation.findMany({
    where: duaWhere,
    orderBy: { createdAt: "desc" },
    take: normalizeSize(query.size),
    select: duaSelect,
  })

  return {
    message: "Success",
    data: duas.map(serializeDua),
  }
})
