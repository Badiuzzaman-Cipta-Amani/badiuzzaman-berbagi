# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Badiuzzaman Berbagi" — an Indonesian donation/fundraising platform. Nuxt 4 running as a **client-only SPA** (`ssr: false`) with its own Nitro server API. UI copy, validation messages, and route names are in Indonesian (`/donasi`, `/masuk`, `/daftar`, `/akun`, `/tentang`).

Because `ssr: false` is global, every route ships the same client bundle; what `routeRules` adds is _when the HTML shell is written_. The marketing and auth routes (`/`, `/tentang`, `/donasi`, `/masuk`, `/daftar`, `/lupa-sandi`) are prerendered so the first paint is a static file, and `/admin/**` is excluded — a back office behind a session has nothing to prerender and must not be indexed. `nitro.prerender.crawlLinks` is `false` on purpose: crawling would follow campaign links into `/donasi/[slug]`, which needs a database the build machine has no business talking to.

The `nitro:init` hook in `nuxt.config.ts` is two Windows-only build workarounds, both documented in place. Without them `nuxt build` dies in the prerenderer before rendering a page. Neither touches runtime behaviour; delete them when the upstream bugs are fixed.

## Commands

```bash
pnpm dev                # dev server on http://localhost:3000
pnpm build              # production build
pnpm preview            # preview the build
pnpm format             # oxfmt — run BEFORE lint (see Style below)
pnpm lint               # eslint (CI gate)
pnpm typecheck          # nuxt typecheck / vue-tsc (CI gate)
pnpm prisma:reset       # DESTRUCTIVE: migrate reset && db push && generate && db seed
```

CI (`.github/workflows/ci.yml`) runs only `lint` and `typecheck` on Node 22. **There is no test suite** — don't invent test commands; verify with `pnpm typecheck` and `pnpm lint`.

After changing `prisma/schema.prisma`, run `pnpm exec prisma generate`. The client is generated into `prisma/generated/` and imported by **relative path**, not `@prisma/client`. A stale generated client is a real failure mode here: it silently produces enum/type mismatches far from the schema edit that caused them.

## Domain vocabulary

A fundraising program is a **Campaign**, addressed by `slug` (never `id`) in URLs and API routes. A donor's prayer/message attached to a donation is a **Dua**. A progress post is a **CampaignUpdate**. The organization behind a campaign is a **Fundraiser**.

A **User** is a donor; an **Admin** is a back-office operator, and the two are unrelated tables with separate sessions. The admin API is the one place that addresses campaigns by `id` rather than `slug` — a slug is editable there, so it cannot also be the handle used to edit it.

A donation is given in one or more **donor names**. `Donation.donorNames` is the roster — a donation can be offered on behalf of a family or a patungan, and every entry is meant to be printed on the donation certificate. `Donation.donorName` is that roster joined into one string, written only by `donate.post.ts` via `joinDonorNames()`, and it exists because Postgres arrays answer `has` but not a case-insensitive `contains`: the public dua feed and the admin donor search both read the joined copy. Never write one without the other. Hiding the name replaces the whole roster with the chosen alias, because the certificate prints exactly what the public sees.

A donation carries a **reference** (`BZ-XXXXXX`): the short, readable code a donor quotes to follow their own donation. It is the public handle for a donation the way `slug` is for a campaign — donations are never addressed by `id` outside the admin API, because a sequential id would let anyone walk the table.

An older `donation`-named layer was removed; if you find a stray reference to `useDonations`, `~/types`, or `server/api/<resource>` without the `v1` prefix, it is dead code.

## Architecture

The data path is one direction, and each layer owns exactly one job:

```
shared/types/models/*.ts   the contract (one type per endpoint)
        ↓                   consumed by BOTH sides
server/utils/*.ts          Prisma selects + serializers (BigInt/Date → JSON)
server/api/v1/**           thin handlers: parse query → call util → return envelope
        ↓                   HTTP
app/services/*.ts          request factories owning reactive query/params + cache key
        ↓
app/components, app/pages  call a service, render `data`/`status`
```

### The contract in `shared/`

`shared/types/**` is auto-imported into **both** the Vue app and Nitro (wired via `imports.dirs` and `nitro.imports.dirs` in `nuxt.config.ts`) — no import statements needed for these types in handlers, services, or components.

Each endpoint gets one exported type describing the whole exchange:

```ts
export type DonateCampaign = {
  params: { slug: string }
  body: { donorName: string; message: string; amount: number }
  response: MessageResponse
}
```

Responses are always wrapped by the envelopes in `shared/types/response.ts`: `MessageResponse` / `DataResponse<T>` / `PaginationResponse<T>`.

**The DTOs are deliberately not Prisma model types.** `CampaignListItem` and friends describe what survives JSON: `BigInt` columns become `number`, `Date` columns become ISO `string`, and derived fields (`progress`, `daysRemaining`, `isUrgent`, `totalDonor`, `cover`) are computed server-side so every consumer agrees. Only the enums (`CampaignCategory`, `CampaignStatus`, `DonationStatus`) are pulled from the generated client, via `shared/types/common.ts`.

To change an endpoint: edit the shared type first, then the handler and the service both fail to compile until they match.

### Server layer

- **The handler owns its query.** `where`, `orderBy`, query-param parsing, and the `prisma.*` call itself live in the route file, so an endpoint can be read end to end in one place. `server/utils/**` holds only what more than one endpoint needs: the shared selects (`campaignListSelect`, `campaignDetailSelect`, `duaSelect`, `updateSelect`, `duaWhere`), the serializers, and the generic query helpers in `query.ts` (`normalizePage`, `normalizeSize`, `buildPaginationMeta`). Do not move a single-endpoint query back into a util.
- **Every `BigInt` and `Date` must be converted before returning.** `id`, `targetAmount`, `raisedAmount`, and `amount` are Prisma `BigInt` and will throw "Do not know how to serialize a BigInt" if returned raw. The serializers are the only correct place to do this.
- Pagination goes through `prisma-extension-pagination`: `prisma.x.paginate({...}).withPages({ page, limit })` returns `[rows, meta]`, and that `meta` already matches `PaginationMeta`. The one exception is the `almost_reach` sort, which ranks by raised/target ratio — not expressible in Prisma's `orderBy`, so `campaigns/index.get.ts` sorts in memory and builds its meta with `buildPaginationMeta`.
- Enum-valued query params must be checked against the generated enum before they reach Prisma (`Object.hasOwn(CampaignCategory, value)`), or the query engine rejects the whole call with "Value 'x' not found in enum". Use `Object.hasOwn`, not `in` — `in` walks the prototype chain and lets `constructor`/`toString` through.
- Body validation uses **valibot**, with the schema in `shared/validation/` so the client form and the endpoint reject identical input.
- `Campaign.raisedAmount` tracks **verified** funds. `donate.post.ts` creates a `pending` donation and deliberately does not touch it; whatever verifies donations must.

### Client service layer

Services in `app/services/` are factories, not composables. Each owns its reactive `query`/`params` refs and a computed cache key, and returns `run()`:

```ts
const { query, run } = getPaginateCampaign({ query: { size: 10 } })
const { data, status } = run()

query.value.category = "mosque" // refetches; the key changes with it
```

The refs are handed to `useQuery` directly, so mutating them refetches and re-keys automatically — never rebuild the service to change a filter. Components call a service; they never call `useQuery`, `useFetch`, or `$fetch` themselves.

`useQuery` (`createUseFetch`) and `useMutation` both read their base URL from `runtimeConfig.public.apiBase` (default `/api/v1`, override with `NUXT_PUBLIC_API_BASE`). Never hardcode a host.

**The public campaign and dua lists grow on scroll rather than page.** `useInfiniteList` keeps the pages a service has already returned — keyed by `meta.currentPage`, so a re-fetch of the same page replaces it instead of duplicating it — and only ever writes `page` back to the service's own `query` ref. It watches every _other_ field of that ref: change a filter and the pile is dropped and the list rewinds to page 1, which is why `/donasi` no longer sets `page = 1` by hand. A response whose `currentPage` is not the page currently requested is discarded as the leftover of a filter that moved mid-flight. `reset()` is for the cases a filter cannot see: a new dua landing at the top of the feed, or the detail route's `slug` changing. The scroll itself is `<BaseInfiniteScroll>` (a `UScrollArea` plus VueUse's `useInfiniteScroll`), which only reports "near the end" — so the container that scrolls needs a height: `/donasi` is a `h-[100dvh]` column with the header and filters outside the scroll region, and the dua feed is capped at `max-h-[70vh]` so it cannot push the donate bar off the page. Admin lists are the deliberate exception — they page through `<AdminTableFooter>`, because an operator needs to know _where_ in 150 rows they are.

### Components

- Auto-import names flatten the path: `app/components/home/section/campaigns.vue` → `<HomeSectionCampaigns />`, `app/components/campaign/card.vue` → `<CampaignCard />`.
- Home sections fetch their own data and render their own skeleton/empty state; `app/pages/index.vue` is just a list of them.
- `<CampaignCover>` centralizes the missing-image fallback — use it rather than reaching into `campaign.cover` and hoping it exists.
- **Reach for Nuxt UI before writing markup.** `UButton`, `UBadge`, `UProgress`, `USkeleton`, `UEmpty`, `UAlert`, `UTabs`, `UTimeline`, `UCarousel`, `UPagination`, `UAvatar`, `UDrawer`, `UModal`, and the `UForm`/`UFormField` family already cover this app's patterns. Hand-rolled `Teleport`+`Transition` overlays, bespoke skeletons, and custom toasts were removed on purpose — do not reintroduce them. The only bare `<button>`s left wrap image content (`detail/documentationTab.vue`, `detail/mediaCarousel.vue`), where a `UButton` would fight the layout.
- **Forms are `UForm` + a valibot schema from `shared/validation/`**, never manual `safeParse` plus an `errors` ref. `UFormField`'s `name` must match the schema key or errors will not bind.
- **Overlays:** bottom sheets are `UDrawer` (`:ui="{ container: 'max-w-md mx-auto' }"` keeps them inside the phone shell); dialogs are `UModal`. Both take `v-model:open`, so parents pass `v-model:open`, not `:show` + `@close`.
- **Toasts** are Nuxt UI's `useToast().add()`. This requires `<UApp>` at the root of `app.vue` — it also provides the overlay and tooltip contexts.
- Nuxt UI 4 + Tailwind 4. `app/assets/css/main.css` owns `@theme static`: the `--color-primary-50…950` navy ramp, `--font-sans`, the **type ramp**, and `--spacing-gutter`. Global control sizes are set once in `app/app.config.ts` (`xl`, for 44px touch targets), along with the `success`/`warning`/`error`/`info` aliases and the `pe-16` header inset that keeps a modal's absolutely-positioned close button off the title. Color mode is pinned to light.
- **The type ramp is overridden, not the root font size.** `--text-xs…--text-3xl` sit one notch above Tailwind's defaults (13px floor rather than 12px), so every existing `text-sm`/`text-xs` grew without inflating the rem-based padding, gap, and size utilities around it. Change the ramp, never `html { font-size }`.
- **One gutter, `--spacing-gutter` (20px), via `px-gutter`/`mx-gutter`.** The hero, the section headings, and the card rails all read from it so they line up on the same edge. Horizontal rails use the `rail` utility rather than repeating flex/snap/overflow classes: padding alone is not enough to keep cards off the screen edge, because a snapped card aligns to the _scrollport_ and slides flush the moment the rail scrolls — `rail` sets `scroll-padding-inline` to match, and adds block padding so the clipping container does not cut off hover shadows and focus rings.
- **Colors come from tokens, not the Tailwind palette.** Use Nuxt UI's semantic utilities (`text-default|muted|dimmed|toned|highlighted`, `bg-default|muted|elevated|accented`, `border-default`) and the `primary-*` ramp. There are no raw `slate-*`/`blue-*` literals left in `app/`; the only deliberate exceptions are `red-300` for error text on dark navy (where `text-error` fails contrast) and the six `<hue>-50`/`<hue>-700` category pairs.
- Icons: Iconify (`i-material-symbols-*`, `i-simple-icons-*`) via `<UIcon>`. Font Awesome and the Google Fonts CDN links are gone; Public Sans self-hosts through `@nuxt/fonts`. Do not add a CDN `<link>` back.
- Presentation for the `CampaignCategory` enum lives in `app/constants/category.ts` (one `tint` per category, all on the same `-50`/`-700` recipe) and sort options in `app/constants/sort.ts` — the enum keys are the contract, the Indonesian names are display only.
- The foundation's own facts — name, address, contact, legal registration, socials — live only in `app/constants/site.ts`. `activeSocials` filters out entries with a `null` `href` so an unset handle renders nothing instead of a link to `#`.
- Money and dates format through `app/utils/number.ts` and `app/utils/date.ts` (`id-ID`, IDR, no fraction digits). Figures that stack in a column carry `.numeric` for tabular digits. **A `UInputNumber` formatting IDR must be given `locale="id-ID"` _and_ `currencyDisplay: "symbol"`** — every other locale renders the ISO code "IDR" instead of the "Rp" symbol donors read. The three that exist (`donationModal`, `createDonationModal`, `admin/campaignForm`) all carry both; a fourth must too.
- The campaign detail page's tabs are Deskripsi / Dokumentasi / Kabar. **Doa is not a tab**: it closes the page as its own section above the donate bar, because it is the social proof a donor reads last, not a fourth thing to choose between.
- **Google Maps share links do not render in an iframe.** `mapsEmbedUrl()` in `app/utils/maps.ts` recovers the pin from whatever shape the stored link came in as, falls back to the campaign's written location, and returns `null` when there is nothing to point at — so the card degrades to no map at all rather than framing an error page. Never put a raw `/maps/place/...` URL in an `<iframe>`. The embedded map is the whole answer to "where is this"; the "Buka di Google Maps" button that used to sit under it was a second route to the same pin whose only effect was sending the donor off the page, and it was removed on purpose.
- Motion is one authored moment: the `page` route transition in `main.css`. Do not add per-section entrance animations.

## Donor accounts

Donors sign in against the `User` table through `server/api/v1/auth/*`, with a **separate** h3 sealed cookie from the admin one (`user_session`, keyed by `runtimeConfig.userSessionPassword`, `NUXT_USER_SESSION_PASSWORD` in production). Like the admin session it carries the id only and re-reads the row per request. Nothing about one session implies anything about the other.

**Giving never requires an account, and that is a rule, not an oversight.** `donate.post.ts` calls `getUserSessionId(event)` to _attribute_ a donation when there is a session and shrugs when there is not. Do not add a guard to the donate path; `app/middleware/auth.ts` is for `/akun/*` only, and `auth-guest` keeps a signed-in donor off `/masuk` and `/daftar`.

`useAuth` mirrors `useAdminAuth`: `useState` plus a `resolved` flag so the session is fetched once. `app.vue` resolves it on mount, because the donate drawer and `/akun` read it without ever passing through a guard. `auth/session.get.ts` answers `data: null` rather than 401 for the same reason `admin/auth/session` does — a browsing guest must not trip `useQuery`'s global 401 redirect.

Password resets are single-use grants in `PasswordReset`, storing only a **hash** of the token, with any outstanding grant invalidated when a new one is issued. `forgot-password` answers identically for a registered and an unregistered address, so it cannot be used to enumerate donors.

## Donation verification

Verification is two halves, and they must not be confused:

- **The donor's half** — `donations/[reference]/confirm.post.ts` records `proofUrl` / `proofNote` and stamps `confirmedAt`. It deliberately does **not** touch `status`, and it refuses a donation that is no longer `pending`.
- **The admin's half** — `admin/donations/[id]/verify.post.ts` is still the only place `status` and `raisedAmount` move, in one `$transaction`, with the delta derived from the transition.

A donor follows their donation by **reference**, not by id: `donations/[reference].get.ts` is public, because a guest donor has no account and the reference is the capability. `generateDonationReference()` draws six characters from a 32-symbol alphabet with `I`, `O`, `0`, and `1` removed — the code gets dictated over WhatsApp.

Client side: `/lacak-donasi` takes a code, `/lacak-donasi/[reference]` shows the receipt and the confirmation form, and `/akun/donasi` lists a signed-in donor's own history. `<DonationReceiptCard>` renders the receipt in all of them, so a donor never learns two layouts for the same fact.

## Admin dashboard

A second surface lives under `/admin`, in Indonesian like the rest of the app. It reuses every layer above — same contracts, same service factories, same envelopes — and adds a session on top.

**Auth.** Admins are the `Admin` table (`email` unique, bcrypt hash in `password`, `roleId` → `Role`), separate from donor `User`s. The session is an **h3 sealed cookie** via `useSession`, keyed by `runtimeConfig.adminSessionPassword` — override it with `NUXT_ADMIN_SESSION_PASSWORD` in production; the checked-in default exists only so `pnpm dev` runs. The cookie carries the admin **id only**, and `getAdminSession` re-reads the row on every request, so deactivating an admin locks them out on their next call rather than at expiry.

**Permissions are a catalogue in code, not rows in a table.** `shared/constants/permission.ts` owns `ADMIN_PERMISSIONS`; `Role.permissions` is a `String[]` holding a subset of those keys. Every key is enforced by a specific route, so a permission nothing checks would be a lie told to whoever grants it — do not add one without the rule that reads it. `super_admin` is resolved by name in `resolvePermissions()` and always holds the whole catalogue, so the role that edits permissions can never revoke its own access to that screen. `sanitizePermissions()` drops anything stored that the catalogue no longer recognises, on both read and write.

**The guard is one middleware, not a call in each handler.** `server/middleware/adminGuard.ts` protects everything under `/api/v1/admin` except `auth/login` and `auth/session`, parks the resolved admin on `event.context.admin`, and matches the route against its `RULES` table to decide which permission it needs. Handlers read the identity back with `currentAdmin(event)` — do not call `requireAdmin` again, it costs another query, and do not re-check permissions in the handler. **An admin route with no rule is refused with 403**, so a new endpoint cannot ship without an access decision; add the rule when you add the route. Rules are matched in order, so a specific pattern goes above the prefix it sits inside.

`auth/session.get.ts` is deliberately outside the guard. It answers `data: null` instead of 401 so the client boot check can decide where to route without tripping the global 401 redirect. `profile/*` is inside the guard but needs no grant — an admin editing their own name or password is not an privileged act, and it is deliberately separate from `accounts/[id].put` so it cannot touch a role or an active flag.

**Client side.** `useAdminAuth` holds the session in `useState` and remembers whether it has asked yet (`resolved`), so the guard does not refetch per navigation. `can(...permissions)` hides what the server would refuse anyway — the API stays the authority. Pages declare `definePageMeta({ layout: "admin", middleware: "admin" })`; the login page uses `layout: false` and `middleware: "admin-guest"`. `useQuery`'s 401 handler branches on the route: `/admin/*` goes to `/admin/login`, everything else to `/masuk`.

`Role.name` is a machine key the guard matches on and is **never rendered raw** — `roleLabel()` in `app/utils/role.ts` prefers `Role.label` and title-cases the key as a fallback.

**Layout.** `app/layouts/admin.vue` is the only full-width surface in the app — the `max-w-md` phone shell in `default.vue` would make a data table unusable. It is built from Nuxt UI's dashboard primitives: `UDashboardGroup` pins the shell to the viewport, `UDashboardSidebar` is a resizable rail on desktop and a slide-over below `lg` (closing itself on navigation), and `UDashboardPanel` gives the content its own scroll region — which is what keeps the header and nav put on a phone instead of scrolling away. Do not reintroduce a hand-rolled `fixed`/`sticky` sidebar. Menu structure lives in `app/constants/adminNav.ts` (`anyOf` gates an entry on permissions), status presentation in `app/constants/status.ts`.

**The admin's own account is not a menu entry.** `/admin/profil` is reachable but lives in the footer identity dropdown (`<AdminUserMenu>`), because it is the account you are already signed in as, not a place to navigate to. It is exported from `adminNav.ts` as `adminProfileNavItem` — outside `adminNavGroups` — precisely so the route guard and the navbar title can still recognise it. Do not put it back in a group.

Lists are `UTable` with `#<column>-cell` slots, wrapped in `-mx-5 overflow-x-auto sm:mx-0` so a wide table scrolls inside the card instead of widening the page. The loading/error/empty triad is `<AdminDataState>` so a failed request never renders as "no data". Table type and the tinted `primary-50` head are set once in `app/app.config.ts` under `ui.table` — do not restyle `th`/`td` per page.

**Every paginated list ends in `<AdminTableFooter>`.** It stacks the range sentence over the pager rather than pushing them to opposite edges, and it reads "90-105 donasi dari 150 donasi" — where the operator is, not just how many rows exist. `sibling-count` is 2 there, one more page number on each side than Nuxt UI's default. Pass `meta`, the page `size`, and the noun; do not hand-roll a `UPagination` row.

**Every list filter goes through two components, and neither is optional.** `<AdminSearchInput>` debounces at **1000ms**, uniformly — the delay is defined once inside the component, not repeated per page. `<AdminFilterSelect>` exists because `USelectMenu` cannot tell an item whose value is the empty string apart from "nothing selected", so the neutral option ("Semua status", "Semua kategori") could be clicked but never took; it swaps in a sentinel and hands the empty string back only on the way out. Do not bind a `USelectMenu` straight to a query ref with a `""` option.

`UBadge` has **no link props**. A badge with `:to` renders a non-clickable span — use `UButton` when the thing is meant to be clicked.

**Money moves in exactly one place.** `donations/[id]/verify.post.ts` derives the `raisedAmount` delta from the _transition_, not from the new status: pending→verified adds, verified→rejected subtracts, pending→rejected does nothing. It runs in a `$transaction` with the status write. Nothing else may touch `raisedAmount`.

**A decision is made on the detail page, never from the queue.** `/admin/donasi` carries no approve/reject buttons: verifying is a judgement about the proof of transfer, the campaign, and the donor's history, and none of that fits in a table row. The row's only action is a labelled button into `/admin/donasi/[id]`, which says "Tinjau & verifikasi" while the donation is pending. Do not put the decision back in the list.

**Dua moderation** is a `Donation.isDuaHidden` flag, not a delete — hiding a message leaves the donation and its amount alone. `duaWhere` in `server/utils/dua.ts` filters on it, so the public feed and the moderation screen stay in sync.

**Deletes refuse rather than cascade.** A campaign with donations, a fundraiser with campaigns, an admin who has verified something, a role still in use, `super_admin` itself — each returns 409 with the reason. Cancelling or deactivating is the intended move; cascading would erase money that was actually received.

`prisma/generated/enums.ts` is import-safe on both sides, so `shared/constants/campaign.ts` derives `CAMPAIGN_CATEGORIES` / `CAMPAIGN_STATUSES` / `DONATION_STATUSES` from it for valibot's `picklist`. Do not hand-write those lists.

**A campaign is read before it is edited.** `/admin/campaign/[id]` is the detail page — the figures, the excerpt and Markdown body, the artwork, the summary of publication settings, and the last five donations (`<AdminCampaignDonationList>`, gated on `donation.view`). `/admin/campaign/[id]/ubah` is the form, and nothing else. The list used to open straight into the form, which made "what does this program say and how is it doing" a question you could only answer through a wall of inputs. The detail page owns the figures for the same reason: do not put the stat cards back on the form.

`<AdminCampaignDonationList>` is a child component rather than a block on the page because the donation endpoint filters by campaign **slug**, which the page only knows after its own request lands — mounting it behind `v-if="campaign"` lets the service start with the right filter instead of firing once unfiltered.

**Admin forms end in `<AdminFormActions>`, and the form must carry `-mb-5 sm:-mb-7`.** The bar is `sticky bottom-0` inside the dashboard panel's scroll region, and a sticky box cannot be pushed past its containing block — without that negative margin cancelling the panel's own bottom padding, scrolling to the end of the form leaves the bar floating one gutter above the bottom edge. It also bleeds sideways (`-mx-5 sm:-mx-7`) so its rule spans the full width, and stacks its buttons full width on a phone. Do not hand-roll the strip again in a new form.

**Campaign artwork is referenced, not uploaded.** The form takes absolute image URLs and `replaceCampaignImages` stores each whole URL in `CampaignAttachment.path` with an empty `name` — the shape `attachmentUrl()` already handles. When a real upload pipeline lands, that function is what changes.

**Kabar terbaru is a drill-down, not a list of posts.** `/admin/kabar` is one row per campaign — `updates/by-campaign.get.ts`, ranked by when each campaign was last written about, because an admin adding an update has to see what they already published for that program or the second post repeats the first. Prisma cannot `orderBy` the maximum of a relation's column, so the ranking is built from a `groupBy` and applied in memory, the same escape hatch `campaigns/index.get.ts` uses for `almost_reach`.

Opening a row lands on `/admin/kabar/[id]`: the campaign header plus **every** kabar it has, paged. From there `/admin/kabar/[id]/baru` writes a new one and `/admin/kabar/[id]/[updateId]` edits an existing one — both full pages rendering the same `<AdminUpdateForm>`, so writing and correcting are one screen rather than two. The modal this replaced could not carry a Markdown editor at a usable width. `campaignId` is owned by the route, never picked in the form.

The header comes from `updates/campaign/[id].get.ts` rather than `admin/campaigns/[id]` so the whole flow needs only `update.view` — an editor whose role cannot open the campaign manager can still see which program they are writing about. `updates/index.get.ts` (the flat, post-first list) is still there, filtered by `campaignId` for the drill-down and by `campaign` slug for the public site.

**Long-form copy is Markdown.** `CampaignUpdate.description` and `Campaign.description` are written through `<AdminMarkdownEditor>` — Nuxt UI's `UEditor` with `content-type="markdown"`, so what lands in the column is text a person could read, not serialized HTML or a ProseMirror blob. The public site renders it with `<BaseMarkdown>`, which sanitizes through `renderMarkdown()` in `app/utils/markdown.ts`; the allow-list there and the `@utility markdown` block in `main.css` are deliberately the same short list. Use `stripMarkdown()` for previews — a heading inside a three-line clamp is noise.

## Style

**oxfmt owns formatting; ESLint owns correctness.** `eslint.config.stylistic` is set to `false` in `nuxt.config.ts` on purpose — the two tools disagree on trailing commas and type-member delimiters, and oxfmt exposes no option for either, so enabling both makes `pnpm lint` permanently unfixable (each `--fix` undoes the other). Do not re-enable it; change `.oxfmtrc.json` instead (double quotes, no semicolons, print width 90).

Note the ESLint config is _generated_ into `.nuxt/eslint.config.mjs` — after editing the `eslint` block in `nuxt.config.ts`, run `pnpm exec nuxt prepare` or ESLint keeps applying the stale rules.

`prisma/generated/**` is excluded from linting in `eslint.config.mjs`.

## Charts

Admin charts are `nuxt-charts` (vue-chrts over Unovis) — `<AreaChart>` for the donation trend, `<DonutChart>` for the campaign-status mix. The module registers them globally with `mode: "client"`, which is a non-issue on an `ssr: false` app, and auto-imports `CurveType` / `DonutType` / `LegendPosition`. **Import those from nothing** — `vue-chrts` is a transitive dependency, so an explicit `import { CurveType } from "vue-chrts"` does not typecheck. `maplibre-gl` arrives through the same tree and is pinned to `false` in `pnpm-workspace.yaml`'s `allowBuilds`; nothing here renders a WebGL map. Do not hand-draw another SVG chart.

## Database

PostgreSQL on Neon. Both the runtime and the Prisma CLI read `NUXT_DATABASE_URL` (falling back to `DATABASE_URL`); `prisma.config.ts` loads `.env` via `process.loadEnvFile()` since Prisma does not do it automatically.

Schema notes: tables/columns are snake_case via `@map`; ids are `BigInt`; `Campaign.slug` is the public identifier, `Donation.reference` the donor-facing one. `prisma/seed.ts` is idempotent — it upserts admins/users/campaigns and clears their attachments/updates/donations before reinserting, so it can be run repeatedly.

`Donation.reference` is `String @unique` with a `cuid()` default that exists only so the column has one; the app always writes the readable `BZ-XXXXXX` code from `generateDonationReference()`. Because the default is Prisma-side rather than database-side, **`prisma db push` cannot add this column to a `donations` table that already has rows** — the documented path is `pnpm prisma:reset`, which reseeds with references in the right shape.

The seeder exists to make the admin dashboard legible, not just to make the app boot: 90 donations spread across the last 90 days (so the trend chart has a real series), campaigns in `active`/`completed`/`draft` (so the status filters have rows), and a pending queue to verify. Its randomness is a **seeded** PRNG, so re-seeding produces the same numbers and a chart that moved is a real change. `raisedAmount` is recomputed from the verified donations it just inserted rather than hardcoded, so the seeded totals agree with the arithmetic in `verify.post.ts`.

Seeded logins all use `testing123`; the super admin is `superadmin@badiuzzaman.co.id`. Passwords are bcrypt-hashed at seed time — never store a plaintext password, even in a fixture.

## Known gaps

Each of these is unfinished in the backend, and the UI now **says so** instead of faking success. When you wire the real thing up, the honest copy is what needs replacing.

- **No mail transport.** `auth/forgot-password` issues a real single-use grant, but nothing sends it. Rather than claim an email was delivered, the endpoint returns the reset link in `data.resetUrl` and `/lupa-sandi` shows it with copy that says why. When a mailer lands, send the link and return `null` — the page already handles that branch.
- **"Galang Donasi" submits nowhere.** `ModalsCreateDonationModal` validates against `shared/validation/campaignRequest.ts` and emits; `app.vue` only toasts. That schema exists so the future endpoint rejects exactly what the form already rejects.
- **No payment gateway.** Donations land as `pending` and no money moves automatically. The verification loop closes it by hand instead: the donor confirms the transfer with a proof link, and an admin matches it against the bank statement. `ModalsQRCodeModal` deliberately does **not** draw a QR-shaped graphic — an unscannable code is worse than an honest placeholder — and hands over the reference instead.
- **Payment proof is a link, not an upload.** `ConfirmDonation` takes a URL the donor pastes, the same stopgap campaign artwork uses. `shared/validation/donation.ts` is what changes when a bucket lands.
- **No campaign image upload.** The admin campaign form takes image URLs. There is no storage bucket, no resizing, no `size`/`width`/`height` recorded for admin-added artwork.
- **No certificate generation.** `Donation.donorNames` is collected and shown back on the receipt, and the donate form's info popover tells donors that is what the names are for — but nothing renders a certificate yet. The roster is the input that pipeline will read; `MAX_DONOR_NAMES` in `shared/validation/donate.ts` is the layout budget it has to respect.
- **No admin audit log.** Role and permission changes, account edits, and campaign deletes leave no trail. Donation verification is the exception — `Donation.verifiedById` and `reviewNote` record who decided and why.

## Design notes

The front end was rebuilt to remove generated-looking decoration. If you are tempted to add any of the following back, it was removed on purpose: mesh//dot-pattern backgrounds, floating icons, shimmer and pulse loops, gradient-clipped headline text, glass panels used as decoration, eyebrow/kicker labels above headings, and white text laid over arbitrary donor photography (it cannot be held to a contrast ratio — card titles go on the card body).

Invented social proof was removed and must not come back: there is no review count, no star rating, and no "150+ / 50rb+ / 25M+" statistics block. Account totals on `/akun` were hardcoded against a login that has no backend.
