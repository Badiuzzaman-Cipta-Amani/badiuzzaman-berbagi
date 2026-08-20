export default eventHandler(async (event): Promise<LogoutAdmin["response"]> => {
  await endAdminSession(event)

  return { message: "Berhasil keluar" }
})
