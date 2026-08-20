<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"
import type { AdminNavGroup } from "~/constants/adminNav"

const { groups, collapsed = false } = defineProps<{
  groups: AdminNavGroup[]
  collapsed?: boolean
}>()

const route = useRoute()

const isCurrent = (to: string, exact?: boolean) =>
  exact ? route.path === to : route.path === to || route.path.startsWith(`${to}/`)

/**
 * `UNavigationMenu` renders a nested array as separate sections, so each group
 * becomes its own list with a `label` item as its heading. Collapsing the
 * sidebar drops the headings — a section title is meaningless next to a bare
 * icon — and the labels move into tooltips instead.
 */
const items = computed<NavigationMenuItem[][]>(() =>
  groups.map((group) => [
    ...(collapsed ? [] : [{ label: group.label, type: "label" as const }]),
    ...group.items.map((item) => ({
      label: item.label,
      icon: item.icon,
      to: item.to,
      active: isCurrent(item.to, item.exact),
    })),
  ]),
)
</script>

<template>
  <UNavigationMenu
    :items="items"
    :collapsed="collapsed"
    orientation="vertical"
    color="primary"
    variant="pill"
    tooltip
    class="w-full"
    :ui="{
      link: 'text-base py-2.5 gap-3',
      linkLeadingIcon: 'size-5.5',
      label: 'text-xs font-semibold uppercase tracking-wider',
    }"
  />
</template>
