<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

import { campaignStatuses } from "~/constants/status"
import { getGroupAdminCampaignUpdate } from "~/services/admin/content"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

/**
 * The kabar screen opens on the *campaigns*, not on the posts. Writing an update
 * always starts from "which program is this about", so that is the only choice
 * this page asks for — everything a campaign has published lives one level in,
 * on its own page, where there is room to read it.
 */
const { query, run } = getGroupAdminCampaignUpdate({ query: { size: 15 } })
const { data, status, error, refresh } = run()

const groups = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta)
const loading = computed(() => status.value === "pending")

const coverageItems = [
  { label: "Semua campaign", value: "" },
  { label: "Sudah ada kabar", value: "posted" },
  { label: "Belum ada kabar", value: "empty" },
]

/** Every filter change restarts paging — page 4 of the old result set is meaningless. */
const setSearch = (value: string) => {
  query.value.search = value
  query.value.page = 1
}

const setCoverage = (value: string) => {
  query.value.coverage = value as Required<GroupAdminCampaignUpdate>["query"]["coverage"]
  query.value.page = 1
}

const columns: TableColumn<AdminCampaignUpdateGroup>[] = [
  { id: "campaign", header: "Campaign" },
  { id: "status", header: "Status" },
  { id: "totalUpdate", header: "Jumlah kabar" },
  { id: "lastPostedAt", header: "Kabar terakhir" },
  { id: "action", header: "" },
]

useSeoMeta({ title: "Kelola Kabar Terbaru", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Kabar terbaru"
      description="Pilih campaign untuk membaca dan menulis kabar perkembangannya. Campaign yang paling baru dikabari tampil lebih dulu."
    >
      <template #actions>
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
        <div class="grid gap-2.5 sm:grid-cols-3">
          <AdminSearchInput
            :model-value="query.search ?? ''"
            placeholder="Cari campaign atau judul kabar..."
            class="sm:col-span-2"
            @update:model-value="setSearch"
          />
          <AdminFilterSelect
            :model-value="query.coverage ?? ''"
            :items="coverageItems"
            icon="i-material-symbols-filter-alt-rounded"
            @update:model-value="setCoverage"
          />
        </div>
      </template>

      <div class="p-5 sm:p-6">
        <AdminDataState
          :loading="loading"
          :error="error"
          :empty="!groups.length"
          :skeleton-rows="5"
          empty-icon="i-material-symbols-menu-book-rounded"
          empty-title="Belum ada campaign"
          empty-description="Buat campaign terlebih dahulu, lalu tulis kabar perkembangannya."
          @retry="refresh()"
        >
          <div class="-mx-5 overflow-x-auto sm:mx-0">
            <UTable :data="groups" :columns="columns" class="w-full min-w-3xl">
              <template #campaign-cell="{ row }">
                <NuxtLink
                  :to="`/admin/kabar/${row.original.campaign.id}`"
                  class="flex min-w-0 items-center gap-3.5"
                >
                  <span class="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <CampaignCover
                      :attachment="row.original.campaign.cover"
                      :title="row.original.campaign.title"
                    />
                  </span>
                  <span class="min-w-0">
                    <span
                      class="block truncate font-medium text-highlighted hover:underline"
                    >
                      {{ row.original.campaign.title }}
                    </span>
                    <span class="block truncate font-mono text-xs text-dimmed">
                      /{{ row.original.campaign.slug }}
                    </span>
                  </span>
                </NuxtLink>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  :label="campaignStatuses[row.original.campaign.status].label"
                  :color="campaignStatuses[row.original.campaign.status].color"
                  :icon="campaignStatuses[row.original.campaign.status].icon"
                  variant="subtle"
                />
              </template>

              <template #totalUpdate-cell="{ row }">
                <span
                  v-if="row.original.totalUpdate"
                  class="numeric font-semibold text-highlighted"
                >
                  {{ formatNumber(row.original.totalUpdate) }} kabar
                </span>
                <span v-else class="text-dimmed">Belum ada</span>
              </template>

              <template #lastPostedAt-cell="{ row }">
                <span v-if="row.original.lastPostedAt" class="text-muted">
                  {{ formatRelativeTime(row.original.lastPostedAt) }}
                </span>
                <span v-else class="text-dimmed">—</span>
              </template>

              <template #action-cell="{ row }">
                <div class="flex justify-end">
                  <UButton
                    :to="`/admin/kabar/${row.original.campaign.id}`"
                    label="Kelola kabar"
                    icon="i-material-symbols-edit-note-rounded"
                    trailing-icon="i-material-symbols-chevron-right-rounded"
                    color="primary"
                    variant="subtle"
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
            noun="campaign"
            @update:page="query.page = $event"
          />
        </AdminDataState>
      </div>
    </UCard>
  </div>
</template>
