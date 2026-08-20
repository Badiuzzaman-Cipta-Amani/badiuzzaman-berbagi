// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@nuxt/fonts",
    "@nuxt/a11y",
    "@nuxt/hints",
    "@vueuse/nuxt",
    "@nuxtjs/seo",
    "@nuxt/image",
    // Admin dashboard charts. Client-only components, registered globally.
    "nuxt-charts",
  ],
  ssr: false,

  imports: {
    dirs: ["shared/types/**/*"],
  },

  devtools: {
    enabled: true,
  },

  app: {
    head: {
      titleTemplate: "%s | Badiuzzaman Berbagi",
      meta: [
        { charset: "utf-8" },
        // No `maximum-scale`/`user-scalable=no`: pinch-zoom is an accessibility
        // requirement, and this is a text-heavy surface read at arm's length.
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Platform donasi terpercaya untuk berbagi kebaikan",
        },
        { name: "theme-color", content: "#1e3a5f" },
        { name: "msapplication-TileColor", content: "#1e3a5f" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "format-detection", content: "telephone=no" },
      ],
    },
    pageTransition: { name: "page", mode: "out-in" },
  },

  css: ["~/assets/css/main.css"],

  // Self-hosted so the type is not a render-blocking third-party request.
  // `--font-sans` in main.css is the single source of truth for the family.
  fonts: {
    families: [
      { name: "Public Sans", provider: "google", weights: [400, 500, 600, 700] },
    ],
  },

  site: {
    url: "https://berbagi.badiuzzaman.co.id",
    name: "Badiuzzaman Berbagi",
  },

  colorMode: {
    preference: "light",
  },

  runtimeConfig: {
    // Seals the admin session cookie. MUST be overridden in production via
    // NUXT_ADMIN_SESSION_PASSWORD — the default only exists so `pnpm dev` runs.
    adminSessionPassword: "dev-only-admin-session-password-change-me",
    // The donor session, sealed separately from the admin one so neither cookie
    // can ever be replayed as the other. NUXT_USER_SESSION_PASSWORD in production.
    userSessionPassword: "dev-only-user-session-password-change-me",
    public: {
      // Override with NUXT_PUBLIC_API_BASE to point the SPA at a different host.
      apiBase: "/api/v1",
    },
  },

  /**
   * The app is already `ssr: false`, so every route ships as the same client
   * bundle. What these rules add is *when the HTML shell is produced*: the
   * marketing and auth routes are written at build time, so the first paint is a
   * static file off the CDN rather than a Nitro render.
   *
   * `/admin/**` is deliberately excluded — a back office behind a session has
   * nothing to prerender, and it must never be indexed.
   */
  routeRules: {
    "/": { prerender: true },
    "/tentang": { prerender: true },
    "/donasi": { prerender: true },
    "/masuk": { prerender: true },
    "/daftar": { prerender: true },
    "/lupa-sandi": { prerender: true },
    "/admin/**": { prerender: false, robots: false },
  },

  compatibilityDate: "2026-06-30",

  nitro: {
    imports: {
      dirs: ["shared/types/**/*"],
    },
    prerender: {
      // Only the routes named in `routeRules` are written ahead of time. Crawling
      // would follow campaign links into `/donasi/[slug]`, which needs a database
      // the build machine has no business talking to.
      crawlLinks: false,
      failOnError: false,
    },
  },

  /**
   * Two Windows-only workarounds, both needed before `nuxt build` can prerender
   * anything at all on this platform. Neither is about this app's code.
   *
   * 1. `@nuxt/nitro-server` mounts its prerender cache with a custom driver
   *    whose path it passes as a `file:///D:/...` URL on Windows only. That one
   *    string has two incompatible consumers: Rollup cannot resolve a `file://`
   *    id and leaves it external, after which the chunk feeds `/D:/...` to
   *    `fileURLToPath`; while Nitro's `createStorage` needs exactly that URL to
   *    `import()` the driver. Neither form of the path builds. The built-in
   *    in-memory driver is resolved by name rather than by path, so it sidesteps
   *    both — giving up only cache reuse between builds, which is build speed.
   *
   * 2. The prerender bundle stamps `globalThis._importMeta_` with the synthetic
   *    URL `file:///_entry.js`. Prisma's generated client shims `__dirname` from
   *    it, and `fileURLToPath` rejects a Windows file URL with no drive letter —
   *    "File URL path must be absolute". Seeding the global with a real URL
   *    first wins, because the bundle only assigns it with `||`. The prerenderer
   *    runs in this same process, so this reaches it.
   */
  hooks: {
    "nitro:init"(nitro) {
      for (const storage of [nitro.options.storage, nitro.options._config.storage]) {
        const mount = storage?.["internal:nuxt:prerender"]

        if (typeof mount?.driver === "string" && mount.driver.includes("cache-driver")) {
          mount.driver = "memory"
        }
      }

      const scope = globalThis as typeof globalThis & {
        _importMeta_?: { url: string; env: NodeJS.ProcessEnv }
      }

      scope._importMeta_ ??= { url: import.meta.url, env: process.env }
    },
  },

  vite: {
    optimizeDeps: {
      include: ["@unhead/schema-org/vue", "valibot"],
    },
  },

  eslint: {
    config: {
      // oxfmt owns formatting (see .oxfmtrc.json). ESLint's stylistic rules
      // disagree with it on trailing commas and type-member delimiters — neither
      // of which oxfmt exposes — so enabling both makes `pnpm lint` unfixable.
      stylistic: false,
    },
  },

  image: {
    // Campaign artwork is stored as remote URLs, so IPX needs them allowlisted.
    domains: ["picsum.photos", "images.unsplash.com"],
  },
})
