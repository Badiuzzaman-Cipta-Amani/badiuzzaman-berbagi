<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

import { donationStatusOptions, donationStatuses } from "~/constants/status"
import { getPaginateAdminDonation } from "~/services/admin/donation"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const route = useRoute()

// Deep link from the dashboard's "menunggu verifikasi" card and from a
// campaign's queue badge lands pre-filtered.
const initialStatus =
  donationStatusOptions.find((option) => option.value === route.query.status)?.value ?? ""

const { query, run } = getPaginateAdminDonation({
  query: {
    size: 15,
    status: initialStatus,
    campaign: String(route.query.campaign ?? ""),
  },
})
const { data, status, error, refresh } = run()

const donations = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta)
const loading = computed(() => status.value === "pending")

const statusItems = [{ label: "Semua status", value: "" }, ...donationStatusOptions]

const sortItems = [
  { label: "Terbaru", value: "latest" },
  { label: "Terlama", value: "oldest" },
  { label: "Nominal terbesar", value: "highest" },
  { label: "Nominal terkecil", value: "lowest" },
]

const columns: TableColumn<AdminDonationItem>[] = [
  { accessorKey: "donorName", header: "Donatur" },
  { accessorKey: "campaign", header: "Campaign" },
  { accessorKey: "amount", header: "Nominal" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "createdAt", header: "Masuk" },
  { id: "action", header: "" },
]

/** Every filter change restarts paging — page 4 of the old result set is meaningless. */
const setSearch = (value: string) => {
  query.value.search = value
  query.value.page = 1
}

const setStatus = (value: string) => {
  query.value.status = value as DonationStatus | ""
  query.value.page = 1
}

const setSort = (value: string) => {
  query.value.sort = value as Required<PaginateAdminDonation>["query"]["sort"]
  query.value.page = 1
}

const clearCampaign = () => {
  query.value.campaign = ""
  query.value.page = 1
}

const resetFilters = () => {
  query.value = {
    page: 1,
    size: 15,
    search: "",
    status: "",
    campaign: "",
    sort: "latest",
  }
}

const hasFilters = computed(
  () =>
    Boolean(query.value.search) ||
    Boolean(query.value.status) ||
    Boolean(query.value.campaign) ||
    (query.value.sort ?? "latest") !== "latest",
)

/**
 * Verifying is deliberately **not** available from this table. A decision that
 * moves money has to be made after reading the donation — the proof of transfer,
 * the campaign, the donor's history — and none of that fits in a row. The detail
 * page is where both buttons live, so the queue can only ever take you there.
 */

useSeoMeta({ title: "Kelola Donasi", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Donasi"
      description="Tinjau donasi yang masuk dan verifikasi bukti pembayarannya."
    >
      <template #actions>
        <UButton
          icon="i-material-symbols-hourglass-top-rounded"
          label="Antrean verifikasi"
          :color="query.status === 'pending' ? 'primary' : 'neutral'"
          :variant="query.status === 'pending' ? 'solid' : 'outline'"
          size="md"
          @click="setStatus(query.status === 'pending' ? '' : 'pending')"
        />
        <UButton
          icon="i-material-symbols-refresh-rounded"
          label="Muat ulang"
          color="neutral"
          variant="outline"
          size="md"
          :loading="loading"
          @click="refresh()"
        />
      </template>
    </AdminPageHeader>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <div class="space-y-2">
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <AdminSearchInput
              :model-value="query.search ?? ''"
              placeholder="Cari donatur, email, atau doa..."
              class="lg:col-span-2"
              @update:model-value="setSearch"
            />
            <AdminFilterSelect
              :model-value="query.status ?? ''"
              :items="statusItems"
              icon="i-material-symbols-filter-alt-rounded"
              @update:model-value="setStatus"
            />
            <AdminFilterSelect
              :model-value="query.sort ?? 'latest'"
              :items="sortItems"
              icon="i-material-symbols-sort-rounded"
              @update:model-value="setSort"
            />
          </div>

          <!--
            A campaign filter arrives from a deep link, so it has to be visible
            and removable here — otherwise the list silently hides rows and the
            operator has no idea why.
          -->
          <div v-if="hasFilters" class="flex flex-wrap items-center gap-2">
            <UButton
              v-if="query.campaign"
              :label="`Campaign: ${query.campaign}`"
              icon="i-material-symbols-mosque-rounded"
              trailing-icon="i-material-symbols-close-rounded"
              color="primary"
              variant="subtle"
              size="xs"
              @click="clearCampaign"
            />
            <UButton
              icon="i-material-symbols-filter-alt-off-rounded"
              label="Reset semua filter"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="resetFilters"
            />
          </div>
        </div>
      </template>

      <div class="p-5 sm:p-6">
        <AdminDataState
          :loading="loading"
          :error="error"
          :empty="!donations.length"
          empty-icon="i-material-symbols-search-off-rounded"
          empty-title="Tidak ada donasi"
          :empty-description="
            hasFilters
              ? 'Coba ubah kata kunci atau lepas sebagian filter.'
              : 'Donasi yang masuk akan tampil di sini.'
          "
          @retry="refresh()"
        >
          <div class="-mx-5 overflow-x-auto sm:mx-0">
            <UTable :data="donations" :columns="columns" class="w-full min-w-3xl">
              <template #donorName-cell="{ row }">
                <div class="min-w-0">
                  <p class="truncate font-medium text-highlighted">
                    {{ row.original.donorName }}
                  </p>
                  <p v-if="row.original.user" class="truncate text-xs text-muted">
                    {{ row.original.user.email }}
                  </p>
                  <p v-else class="text-xs text-dimmed">Tanpa akun</p>
                </div>
              </template>

              <!--
                The campaign is where an operator goes next about half the time,
                so the cell is the link — reading the title and then hunting for
                the row that carries it is the step this removes.
              -->
              <template #campaign-cell="{ row }">
                <NuxtLink
                  v-if="row.original.campaign"
                  :to="`/admin/campaign/${row.original.campaign.id}`"
                  class="inline-flex max-w-56 items-start gap-1 text-primary-700 hover:underline"
                >
                  <span class="line-clamp-2">{{ row.original.campaign.title }}</span>
                  <UIcon
                    name="i-material-symbols-arrow-outward-rounded"
                    class="mt-0.5 size-4 shrink-0"
                  />
                </NuxtLink>
                <span v-else class="text-dimmed">—</span>
              </template>

              <template #amount-cell="{ row }">
                <span class="numeric font-semibold text-highlighted">
                  {{ formatCurrency(row.original.amount) }}
                </span>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  :label="donationStatuses[row.original.status].label"
                  :color="donationStatuses[row.original.status].color"
                  :icon="donationStatuses[row.original.status].icon"
                  variant="subtle"
                />
              </template>

              <template #createdAt-cell="{ row }">
                <span class="text-muted">
                  {{ formatRelativeTime(row.original.createdAt) }}
                </span>
              </template>

              <!--
                Labelled, not an unmarked chevron: this is now the only way into
                a decision, so it has to look like the thing you are meant to
                press. A pending row says so, because that is the queue's job.
              -->
              <template #action-cell="{ row }">
                <div class="flex items-center justify-end">
                  <UButton
                    :to="`/admin/donasi/${row.original.id}`"
                    :label="
                      row.original.status === 'pending' ? 'Tinjau & verifikasi' : 'Detail'
                    "
                    :icon="
                      row.original.status === 'pending'
                        ? 'i-material-symbols-fact-check-rounded'
                        : 'i-material-symbols-visibility-rounded'
                    "
                    trailing-icon="i-material-symbols-chevron-right-rounded"
                    :color="row.original.status === 'pending' ? 'primary' : 'neutral'"
                    :variant="row.original.status === 'pending' ? 'solid' : 'outline'"
                    size="md"
                    class="shrink-0"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <AdminTableFooter
            v-if="meta"
            :meta="meta"
            :size="query.size ?? 15"
            noun="donasi"
            @update:page="query.page = $event"
          />
        </AdminDataState>
      </div>
    </UCard>
  </div>
</template>
