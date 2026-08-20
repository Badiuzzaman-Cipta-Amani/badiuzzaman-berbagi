<script setup lang="ts">
const route = useRoute()
const showCreateModal = useState("showCreateModal", () => false)

/**
 * Active state is carried by the icon's fill as well as its color, so it does
 * not depend on hue alone.
 */
const tabs = [
  {
    to: "/",
    label: "Beranda",
    icon: "i-material-symbols-home-outline-rounded",
    activeIcon: "i-material-symbols-home-rounded",
  },
  {
    to: "/donasi",
    label: "Donasi",
    icon: "i-material-symbols-volunteer-activism-outline-rounded",
    activeIcon: "i-material-symbols-volunteer-activism-rounded",
  },
  {
    to: "/tentang",
    label: "Tentang",
    icon: "i-material-symbols-info-outline-rounded",
    activeIcon: "i-material-symbols-info-rounded",
  },
  {
    to: "/akun",
    label: "Akun",
    icon: "i-material-symbols-person-outline-rounded",
    activeIcon: "i-material-symbols-person-rounded",
  },
]

const isActive = (path: string) =>
  path === "/" ? route.path === "/" : route.path.startsWith(path)
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-default bg-default/95 pb-safe backdrop-blur-md"
    aria-label="Navigasi utama"
  >
    <div class="grid grid-cols-5 items-end px-1 pt-1.5 pb-1">
      <template v-for="(tab, index) in tabs" :key="tab.to">
        <NuxtLink
          :to="tab.to"
          :aria-current="isActive(tab.to) ? 'page' : undefined"
          class="flex min-h-11 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          :class="isActive(tab.to) ? 'text-primary' : 'text-dimmed hover:text-toned'"
        >
          <UIcon
            :name="isActive(tab.to) ? tab.activeIcon : tab.icon"
            class="size-6 shrink-0"
          />
          <span class="text-[11px] leading-none font-semibold tracking-tight">
            {{ tab.label }}
          </span>
        </NuxtLink>

        <!-- The raise sits mid-row, between Donasi and Tentang. -->
        <div v-if="index === 1" class="flex justify-center">
          <UButton
            icon="i-material-symbols-add-rounded"
            color="primary"
            size="xl"
            :ui="{ leadingIcon: 'size-6' }"
            class="-mt-7 size-14 justify-center rounded-2xl border-4 border-default shadow-lg shadow-primary-900/25 transition active:scale-95"
            aria-label="Galang donasi baru"
            @click="showCreateModal = true"
          />
        </div>
      </template>
    </div>
  </nav>
</template>
