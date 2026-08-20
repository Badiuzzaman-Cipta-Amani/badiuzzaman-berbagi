/**
 * Answers `data: null` for a signed-out visitor rather than 401. The client boot
 * check calls this on every first load, and a 401 here would trip `useQuery`'s
 * global redirect and bounce a browsing guest to the sign-in page.
 */
export default eventHandler(async (event): Promise<SessionUser["response"]> => {
  return { message: "Success", data: await getUserSession(event) }
})
