/**
 * Deliberately outside the guard: the dashboard calls this on boot to find out
 * whether it has a session at all, and a 401 there would trip the global
 * redirect before the router had a chance to decide where to go.
 */
export default eventHandler(async (event): Promise<SessionAdmin["response"]> => {
  const admin = await getAdminSession(event)

  return { message: "Success", data: admin }
})
