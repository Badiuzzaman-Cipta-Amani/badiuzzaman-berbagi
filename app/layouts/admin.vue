<script setup lang="ts">
import { adminNavGroups, adminProfileNavItem } from "~/constants/adminNav"

/**
 * The back office is the one full-width surface in this app — the phone shell
 * that `default.vue` imposes would make a data table unusable.
 *
 * Nuxt UI's dashboard primitives own the shell: `UDashboardGroup` pins it to the
 * viewport, `UDashboardSidebar` is a resizable rail on desktop and a slide-over
 * below `lg` (closing itself on navigation), and `UDashboardPanel` gives the
 * content its own scroll region. That is what keeps the header and the sidebar
 * put on a phone instead of scrolling away with the page.
 */
const { admin, can } = useAdminAuth()
const route = useRoute()

const groups = computed(() =>
  adminNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.anyOf || can(...item.anyOf)),
    }))
    .filter((group) => group.items.length),
)

const isCurrent = (to: string, exact?: boolean) =>
  exact ? route.path === to : route.path === to || route.path.startsWith(`${to}/`)

// The profile page is reachable but no longer in the sidebar, so the navbar has
// to name it from the same list the guard uses rather than falling back to "Admin".
const currentTitle = computed(
  () =>
    [...groups.value.flatMap((group) => group.items), adminProfileNavItem].find((item) =>
      isCurrent(item.to, item.exact),
    )?.label ?? "Admin",
)
</script>

<template>
  <UDashboardGroup unit="rem" storage-key="admin-sidebar">
    <UDashboardSidebar
      id="admin-nav"
      resizable
      collapsible
      :default-size="16"
      :min-size="13"
      :max-size="22"
      :ui="{ footer: 'border-t border-default', header: 'border-b border-default' }"
    >
      <template #header="{ collapsed }">
        <AdminBrand :collapsed="collapsed" />
        <UDashboardSidebarCollapse class="ms-auto" />
      </template>

      <template #default="{ collapsed }">
        <AdminNavList :groups="groups" :collapsed="collapsed" />
      </template>

      <template #footer="{ collapsed }">
        <AdminUserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <!-- One extra step of gutter: the content used to start where the header ended. -->
    <UDashboardPanel id="admin-content" :ui="{ body: 'p-5 sm:p-7' }">
      <template #header>
        <UDashboardNavbar :title="currentTitle">
          <template #right>
            <UBadge
              v-if="admin"
              :label="roleLabel(admin.role)"
              icon="i-material-symbols-verified-user-rounded"
              color="primary"
              variant="subtle"
              size="lg"
            />
            <UButton
              to="/"
              target="_blank"
              icon="i-material-symbols-open-in-new-rounded"
              label="Lihat situs"
              color="neutral"
              variant="ghost"
              size="md"
              class="hidden sm:inline-flex"
            />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
