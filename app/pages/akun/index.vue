<script setup lang="ts">
const { user, isLoggedIn, fetchSession, logout } = useAuth()
const toast = useToast()

// The account tab is reachable without the `auth` guard on purpose: a signed-out
// visitor gets the sign-in invitation rather than a redirect they did not ask for.
await fetchSession()

const menuItems = [
  {
    label: "Riwayat donasi",
    description: "Status setiap donasi yang pernah Anda kirim",
    icon: "i-material-symbols-receipt-long-rounded",
    to: "/akun/donasi",
  },
  {
    label: "Ubah profil",
    description: "Nama, email, nomor WhatsApp, dan kata sandi",
    icon: "i-material-symbols-manage-accounts-rounded",
    to: "/akun/profil",
  },
  {
    label: "Lacak donasi",
    description: "Cari donasi dengan kode, termasuk donasi tanpa akun",
    icon: "i-material-symbols-search-rounded",
    to: "/lacak-donasi",
  },
  {
    label: "Tentang kami",
    description: "Profil yayasan dan cara menghubungi tim",
    icon: "i-material-symbols-info-rounded",
    to: "/tentang",
  },
]

const handleLogout = async () => {
  await logout("/")
  toast.add({
    title: "Berhasil keluar",
    icon: "i-material-symbols-check-circle-rounded",
    color: "success",
  })
}

usePageSeo({
  title: "Akun Saya",
  description:
    "Kelola akun Badiuzzaman Berbagi Anda, lihat riwayat donasi, dan perbarui profil.",
  type: "website",
})
</script>

<template>
  <main class="px-gutter pt-7 pb-28">
    <h1 class="text-2xl font-bold tracking-tight text-highlighted">Akun saya</h1>

    <template v-if="isLoggedIn && user">
      <div class="mt-6 flex items-center gap-4">
        <UAvatar
          :text="user.name.charAt(0).toUpperCase()"
          size="3xl"
          :ui="{ root: 'bg-primary text-inverted', fallback: 'font-bold' }"
        />
        <div class="min-w-0">
          <p class="truncate text-lg font-semibold text-highlighted">{{ user.name }}</p>
          <p class="truncate text-sm text-muted">{{ user.email }}</p>
          <p v-if="user.phone" class="truncate numeric text-sm text-muted">
            {{ user.phone }}
          </p>
        </div>
      </div>

      <!--
        The two figures a donor actually looks for. `totalDonated` counts
        verified donations only, the same rule `raisedAmount` follows.
      -->
      <dl class="mt-6 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-default p-4">
          <dt class="text-xs text-muted">Total terverifikasi</dt>
          <dd class="mt-1 numeric text-xl font-bold text-primary">
            {{ formatCurrency(user.totalDonated) }}
          </dd>
        </div>
        <div class="rounded-2xl border border-default p-4">
          <dt class="text-xs text-muted">Jumlah donasi</dt>
          <dd class="mt-1 numeric text-xl font-bold text-highlighted">
            {{ formatNumber(user.totalDonation) }}
          </dd>
        </div>
      </dl>

      <ul class="mt-6 divide-y divide-default rounded-2xl border border-default">
        <li v-for="item in menuItems" :key="item.label">
          <NuxtLink
            :to="item.to"
            class="flex items-center gap-3 px-4 py-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <UIcon :name="item.icon" class="size-6 shrink-0 text-primary" />
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-highlighted">
                {{ item.label }}
              </span>
              <span class="block truncate text-xs text-muted">
                {{ item.description }}
              </span>
            </span>
            <UIcon
              name="i-material-symbols-chevron-right-rounded"
              class="size-5 shrink-0 text-dimmed"
            />
          </NuxtLink>
        </li>
      </ul>

      <UButton
        label="Keluar"
        icon="i-material-symbols-logout-rounded"
        color="error"
        variant="subtle"
        size="xl"
        block
        class="mt-6"
        @click="handleLogout"
      />
    </template>

    <template v-else>
      <UEmpty
        icon="i-material-symbols-person-outline-rounded"
        title="Belum masuk"
        description="Masuk untuk melihat riwayat donasi dan mengelola akun Anda."
        :actions="[
          { label: 'Masuk', color: 'primary', size: 'xl', to: '/masuk' },
          {
            label: 'Daftar akun',
            color: 'neutral',
            variant: 'ghost',
            size: 'xl',
            to: '/daftar',
          },
        ]"
        class="mt-10"
      />

      <!-- Giving without an account is supported, so the way to follow one is too. -->
      <div class="mt-8 rounded-2xl border border-dashed border-default p-5 text-center">
        <UIcon name="i-material-symbols-search-rounded" class="size-8 text-primary-300" />
        <p class="mt-2 text-sm font-semibold text-highlighted">Berdonasi tanpa akun?</p>
        <p class="mt-1 text-xs leading-relaxed text-muted">
          Gunakan kode donasi yang Anda terima untuk melihat status dan mengirim bukti
          transfer.
        </p>
        <UButton
          to="/lacak-donasi"
          label="Lacak donasi"
          color="primary"
          variant="subtle"
          size="lg"
          class="mt-4"
        />
      </div>
    </template>
  </main>
</template>
