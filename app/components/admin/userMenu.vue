<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui"

const { collapsed = false } = defineProps<{ collapsed?: boolean }>()

const { admin, logout } = useAdminAuth()

const initials = computed(() =>
  (admin.value?.name ?? "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join(""),
)

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: admin.value?.name ?? "—",
      // The role reads as words, not as the `super_admin` key the guard uses.
      description: roleLabel(admin.value?.role),
      avatar: { text: initials.value || "?" },
      type: "label",
    },
  ],
  [
    {
      label: "Profil saya",
      icon: "i-material-symbols-badge-rounded",
      to: "/admin/profil",
    },
    {
      label: "Lihat situs",
      icon: "i-material-symbols-open-in-new-rounded",
      to: "/",
      target: "_blank",
    },
  ],
  [
    {
      label: "Keluar",
      icon: "i-material-symbols-logout-rounded",
      color: "error" as const,
      onSelect: () => logout(),
    },
  ],
])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', side: 'top' }"
    :ui="{ content: 'w-64', item: 'text-base py-2', itemLeadingIcon: 'size-5' }"
    class="w-full"
  >
    <UButton
      color="neutral"
      variant="ghost"
      size="lg"
      block
      class="justify-start"
      :square="collapsed"
      :trailing-icon="collapsed ? undefined : 'i-material-symbols-unfold-more-rounded'"
      :aria-label="`Menu akun ${admin?.name ?? ''}`"
      :ui="{ trailingIcon: 'ms-auto' }"
    >
      <UAvatar :text="initials || '?'" size="sm" />
      <span v-if="!collapsed" class="min-w-0 text-start">
        <span class="block truncate text-base font-semibold text-highlighted">
          {{ admin?.name ?? "—" }}
        </span>
        <span class="block truncate text-sm font-normal text-muted">
          {{ roleLabel(admin?.role) }}
        </span>
      </span>
    </UButton>
  </UDropdownMenu>
</template>
