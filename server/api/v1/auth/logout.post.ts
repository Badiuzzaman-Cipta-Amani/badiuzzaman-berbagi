export default eventHandler(async (event): Promise<LogoutUser["response"]> => {
  await endUserSession(event)
  return { message: "Berhasil keluar" }
})
