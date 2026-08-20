<script setup lang="ts">
import { donationStatuses } from "~/constants/status"
import { getDetailAdminUser } from "~/services/admin/user"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const route = useRoute()

const id = computed(() => String(route.params.id ?? ""))

const { run } = getDetailAdminUser({ params: { id: id.value } })
const { data, status, error, refresh } = run()

const user = computed(() => data.value?.data)
const loading = computed(() => status.value === "pending")

useSeoMeta({ title: "Detail Donatur", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      :title="user?.name ?? 'Detail donatur'"
      :description="user?.email"
      back-to="/admin/donatur"
      back-label="Kembali ke daftar donatur"
    />

    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-28 w-full rounded-xl" />
      <USkeleton class="h-72 w-full rounded-xl" />
    </div>

    <UAlert
      v-else-if="error || !user"
      color="error"
      variant="subtle"
      icon="i-material-symbols-cloud-off-rounded"
      title="Donatur tidak dapat dimuat"
      description="Data mungkin sudah dihapus, atau koneksi Anda terputus."
      :actions="[
        {
          label: 'Coba lagi',
          color: 'error',
          variant: 'solid',
          onClick: () => refresh(),
        },
      ]"
    />

    <template v-else>
      <div class="grid gap-5 sm:grid-cols-3">
        <AdminStatCard
          label="Total terverifikasi"
          tone="success"
          :value="formatCurrency(user.totalDonated)"
          icon="i-material-symbols-volunteer-activism-rounded"
        />
        <AdminStatCard
          label="Jumlah donasi"
          tone="info"
          :value="formatNumber(user.totalDonation)"
          icon="i-material-symbols-receipt-long-rounded"
        />
        <AdminStatCard
          label="Bergabung"
          tone="primary"
          :value="formatDate(user.createdAt)"
          icon="i-material-symbols-calendar-month-rounded"
          :hint="user.phone ?? 'Telepon belum diisi'"
        />
      </div>

      <UCard class="mt-4">
        <template #header>
          <h3 class="text-lg font-semibold text-highlighted">Riwayat donasi terakhir</h3>
        </template>

        <!-- Hand-rolled rather than `UTable` because it renders a fixed slice, not
             a paged query — but it wears the same tinted head as every other table. -->
        <div v-if="user.donations.length" class="-mx-5 overflow-x-auto sm:mx-0">
          <table class="w-full min-w-2xl text-base">
            <thead>
              <tr class="text-left text-sm tracking-wide text-primary-800">
                <th scope="col" class="rounded-s-lg bg-primary-50 px-4 py-3.5 font-bold">
                  Campaign
                </th>
                <th scope="col" class="bg-primary-50 px-4 py-3.5 text-right font-bold">
                  Nominal
                </th>
                <th scope="col" class="bg-primary-50 px-4 py-3.5 font-bold">Status</th>
                <th scope="col" class="bg-primary-50 px-4 py-3.5 font-bold">Waktu</th>
                <th scope="col" class="rounded-e-lg bg-primary-50 px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="donation in user.donations"
                :key="donation.id"
                class="border-b border-primary-100 last:border-0"
              >
                <td class="max-w-64 truncate px-4 py-4 text-toned">
                  {{ donation.campaign?.title ?? "—" }}
                </td>
                <td class="px-4 py-4 text-right numeric font-semibold text-highlighted">
                  {{ formatCurrency(donation.amount) }}
                </td>
                <td class="px-4 py-4">
                  <UBadge
                    :label="donationStatuses[donation.status].label"
                    :color="donationStatuses[donation.status].color"
                    :icon="donationStatuses[donation.status].icon"
                    variant="subtle"
                  />
                </td>
                <td class="px-4 py-4 text-muted">
                  {{ formatRelativeTime(donation.createdAt) }}
                </td>
                <td class="px-4 py-4 text-right">
                  <UButton
                    :to="`/admin/donasi/${donation.id}`"
                    label="Detail"
                    icon="i-material-symbols-visibility-rounded"
                    color="neutral"
                    variant="outline"
                    size="md"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <UEmpty
          v-else
          icon="i-material-symbols-receipt-long-rounded"
          title="Belum ada donasi"
          description="Donatur ini belum pernah berdonasi melalui akunnya."
        />
      </UCard>
    </template>
  </div>
</template>
