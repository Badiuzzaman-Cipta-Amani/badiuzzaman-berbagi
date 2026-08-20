import { SUPER_ADMIN_ROLE } from "~~/shared/constants/permission"

export default eventHandler(async (event): Promise<DeleteAdminRole["response"]> => {
  const id = parseIntParam(event)

  const role = await prisma.role.findUnique({
    where: { id },
    select: { id: true, name: true, _count: { select: { admins: true } } },
  })

  if (!role) {
    throw createError({ status: 404, statusMessage: "Peran tidak ditemukan" })
  }

  if (role.name === SUPER_ADMIN_ROLE) {
    throw createError({
      status: 409,
      statusMessage: "Peran super_admin tidak dapat dihapus",
    })
  }

  if (role._count.admins > 0) {
    throw createError({
      status: 409,
      statusMessage: "Peran ini masih dipakai admin lain",
    })
  }

  await prisma.role.delete({ where: { id } })

  return { message: "Peran berhasil dihapus" }
})
