// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs"

export default withNuxt({
  // Prisma writes this client on every `generate`; linting it is noise.
  ignores: ["prisma/generated/**"],
})
