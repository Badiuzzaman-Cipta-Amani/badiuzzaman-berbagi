import { defineConfig } from "prisma/config"

// Prisma does not read .env on its own, and the seed subprocess inherits whatever
// we load here. Node's built-in loader keeps this dependency-free.
try {
  process.loadEnvFile()
} catch {
  // No .env file present — rely on the ambient environment instead.
}

const url = process.env.NUXT_DATABASE_URL ?? process.env.DATABASE_URL

if (!url) {
  throw new Error("NUXT_DATABASE_URL or DATABASE_URL must be defined")
}

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url,
  },
})
