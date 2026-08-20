<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

import { categories, categoryLabel } from "~/constants/category"
import { campaignStatusOptions, campaignStatuses } from "~/constants/status"
import { deleteAdminCampaign, getPaginateAdminCampaign } from "~/services/admin/campaign"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const toast = useToast()

const { query, run } = getPaginateAdminCampaign({ query: { size: 15 } })
const { data, status, error, refresh } = run()

const campaigns = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta)
const loading = computed(() => status.value === "pending")

const statusItems = [{ label: "Semua status", value: "" }, ...campaignStatusOptions]

const categoryItems = [
  { label: "Semua kategori", value: "" },
  ...categories.map((item) => ({ label: item.name, value: item.key })),
]

const sortItems = [
  { label: "Terbaru", value: "latest" },
  { label: "Terlama", value: "oldest" },
  { label: "Dana terbesar", value: "highest_raised" },
  { label: "Hampir tercapai", value: "almost_reach" },
]

/** Every filter change restarts paging — page 4 of the old result set is meaningless. */
const setSearch = (value: string) => {
  query.value.search = value
  query.value.page = 1
}

const setStatus = (value: string) => {
  query.value.status = value as CampaignStatus | ""
  query.value.page = 1
}

const setCategory = (value: string) => {
  query.value.category = value as CampaignCategory | ""
  query.value.page = 1
}

const setSort = (value: string) => {
  query.value.sort = value as Required<PaginateAdminCampaign>["query"]["sort"]
  query.value.page = 1
}

const columns: TableColumn<AdminCampaignItem>[] = [
  { accessorKey: "title", header: "Campaign" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "raisedAmount", header: "Perolehan" },
  { accessorKey: "pendingDonation", header: "Antrean" },
  { id: "action", header: "" },
]

const target = ref<AdminCampaignItem | null>(null)
const confirmOpen = ref(false)

const { params: deleteParams, run: runDelete } = deleteAdminCampaign()
const { execute: removeCampaign, pending: removing } = runDelete()

const askDelete = (campaign: AdminCampaignItem) => {
  target.value = campaign
  confirmOpen.value = true
}

const confirmDelete = async () => {
  if (!target.value) return

  deleteParams.value.id = target.value.id

  try {
    const response = await removeCampaign()
    confirmOpen.value = false
    await refresh()
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch (err) {
    toast.add({
      title: "Campaign tidak dapat dihapus",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Silakan coba lagi.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

useSeoMeta({ title: "Kelola Campaign", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Campaign"
      description="Buat, ubah, dan publikasikan program penggalangan dana."
    >
      <template #actions>
        <UButton
          to="/admin/campaign/baru"
          icon="i-material-symbols-add-rounded"
          label="Campaign baru"
          color="primary"
          size="md"
        />
      </template>
    </AdminPageHeader>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <AdminSearchInput
            :model-value="query.search ?? ''"
            placeholder="Cari judul atau lokasi..."
            @update:model-value="setSearch"
          />
          <AdminFilterSelect
            :model-value="query.status ?? ''"
            :items="statusItems"
            icon="i-material-symbols-filter-alt-rounded"
            @update:model-value="setStatus"
          />
          <AdminFilterSelect
            :model-value="query.category ?? ''"
            :items="categoryItems"
            icon="i-material-symbols-category-rounded"
            @update:model-value="setCategory"
          />
          <AdminFilterSelect
            :model-value="query.sort ?? 'latest'"
            :items="sortItems"
            icon="i-material-symbols-sort-rounded"
            @update:model-value="setSort"
          />
        </div>
      </template>

      <div class="p-5 sm:p-6">
        <AdminDataState
          :loading="loading"
          :error="error"
          :empty="!campaigns.length"
          empty-icon="i-material-symbols-mosque-rounded"
          empty-title="Belum ada campaign"
          empty-description="Mulai dengan membuat campaign baru."
          @retry="refresh()"
        >
          <div class="-mx-5 overflow-x-auto sm:mx-0">
            <UTable :data="campaigns" :columns="columns" class="w-full min-w-3xl">
              <template #title-cell="{ row }">
                <!-- The title is the way into the campaign, so it is the link. -->
                <NuxtLink
                  :to="`/admin/campaign/${row.original.id}`"
                  class="flex min-w-0 items-center gap-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <span class="size-11 shrink-0 overflow-hidden rounded-lg">
                    <CampaignCover
                      :attachment="row.original.cover"
                      :title="row.original.title"
                    />
                  </span>

                  <div class="min-w-0">
                    <p class="truncate font-medium text-highlighted">
                      {{ row.original.title }}
                    </p>
                    <p class="truncate text-xs text-muted">
                      {{ categoryLabel(row.original.category) }}
                      <template v-if="row.original.location">
                        · {{ row.original.location }}
                      </template>
                    </p>
                  </div>
                </NuxtLink>
              </template>

              <template #status-cell="{ row }">
                <UBadge
                  :label="campaignStatuses[row.original.status].label"
                  :color="campaignStatuses[row.original.status].color"
                  variant="subtle"
                />
              </template>

              <template #raisedAmount-cell="{ row }">
                <div class="w-40">
                  <p class="numeric text-sm font-semibold text-highlighted">
                    {{ formatCurrencyShort(row.original.raisedAmount) }}
                    <span class="font-normal text-muted">
                      / {{ formatCurrencyShort(row.original.targetAmount) }}
                    </span>
                  </p>
                  <UProgress
                    :model-value="row.original.progress"
                    size="sm"
                    color="primary"
                    class="mt-1.5"
                  />
                </div>
              </template>

              <template #pendingDonation-cell="{ row }">
                <!--
                `UBadge` has no link props, so this used to render a badge that
                looked clickable and was not. A `UButton` is the affordance.
              -->
                <UButton
                  v-if="row.original.pendingDonation"
                  :to="`/admin/donasi?status=pending&campaign=${row.original.slug}`"
                  :label="`${row.original.pendingDonation} menunggu`"
                  icon="i-material-symbols-hourglass-top-rounded"
                  color="warning"
                  variant="subtle"
                  size="xs"
                />
                <span v-else class="text-sm text-dimmed">—</span>
              </template>

              <template #action-cell="{ row }">
                <!--
                  "Detail" is labelled rather than an icon: it is the row's
                  primary move, and the campaign is read before it is edited.
                -->
                <div class="flex items-center justify-end gap-1">
                  <UButton
                    :to="`/admin/campaign/${row.original.id}`"
                    label="Detail"
                    icon="i-material-symbols-visibility-rounded"
                    color="neutral"
                    variant="outline"
                    size="sm"
                  />
                  <UButton
                    :to="`/admin/campaign/${row.original.id}/ubah`"
                    icon="i-material-symbols-edit-rounded"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :aria-label="`Ubah ${row.original.title}`"
                  />
                  <UButton
                    icon="i-material-symbols-delete-outline-rounded"
                    color="error"
                    variant="ghost"
                    size="sm"
                    :aria-label="`Hapus ${row.original.title}`"
                    @click="askDelete(row.original)"
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

    <AdminConfirmModal
      v-model:open="confirmOpen"
      title="Hapus campaign ini?"
      :description="`“${target?.title}” akan dihapus permanen. Campaign yang sudah menerima donasi tidak dapat dihapus — batalkan statusnya sebagai gantinya.`"
      :loading="removing"
      @confirm="confirmDelete"
    />
  </div>
</template>
