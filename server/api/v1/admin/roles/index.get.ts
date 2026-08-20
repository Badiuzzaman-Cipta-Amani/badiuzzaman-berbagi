/** Unpaginated: the role table is a handful of rows and the account form needs all of them. */
export default eventHandler(async (): Promise<ListAdminRole["response"]> => {
  const rows = await prisma.role.findMany({
    orderBy: { name: "asc" },
    select: adminRoleSelect,
  })

  return { message: "Success", data: rows.map(serializeAdminRole) }
})
