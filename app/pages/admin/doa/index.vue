<script setup lang="ts">
import { donationStatuses } from "~/constants/status"
import { getPaginateAdminDua, patchAdminDuaVisibility } from "~/services/admin/dua"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const toast = useToast()

const { query, run } = getPaginateAdminDua({ query: { size: 15 } })
const { data, status, error, refresh } = run()

const duas = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta)
const loading = computed(() => status.value === "pending")

const { can } = useAdminAuth()
const canModerate = computed(() => can("dua.moderate"))

const visibilityItems = [
  { label: "Semua doa", value: "" },
  { label: "Tampil", value: "visible" },
  { label: "Disembunyikan", value: "hidden" },
]

/** Every filter change restarts paging — page 4 of the old result set is meaningless. */
const setSearch = (value: string) => {
  query.value.search = value
  query.value.page = 1
}

const setVisibilityFilter = (value: string) => {
  query.value.visibility = value as Required<PaginateAdminDua>["query"]["visibility"]
  query.value.page = 1
}

const { params, body, run: runToggle } = patchAdminDuaVisibility()
const { execute: toggle } = runToggle()

/** Which row is mid-request, so only that button shows a spinner. */
const togglingId = ref<string | null>(null)

const setVisibility = async (dua: AdminDuaItem, hidden: boolean) => {
  params.value.id = dua.id
  body.value = { isDuaHidden: hidden }
  togglingId.value = dua.id

  try {
    const response = await toggle()
    await refresh()
    toast.add({
      title: response.message,
      icon: hidden
        ? "i-material-symbols-visibility-off-rounded"
        : "i-material-symbols-visibility-rounded",
      color: "success",
    })
  } catch (err) {
    toast.add({
      title: "Gagal memperbarui doa",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Silakan coba lagi.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  } finally {
    togglingId.value = null
  }
}

useSeoMeta({ title: "Moderasi Doa", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Doa donatur"
      description="Pesan yang ditulis donatur dan tampil pada halaman publik. Sembunyikan yang tidak pantas."
    />

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <div class="grid gap-2 sm:grid-cols-3">
          <AdminSearchInput
            :model-value="query.search ?? ''"
            placeholder="Cari isi doa atau nama donatur..."
            class="sm:col-span-2"
            @update:model-value="setSearch"
          />
          <AdminFilterSelect
            :model-value="query.visibility ?? ''"
            :items="visibilityItems"
            icon="i-material-symbols-visibility-rounded"
            @update:model-value="setVisibilityFilter"
          />
        </div>
      </template>

      <div class="p-5 sm:p-6">
        <AdminDataState
          :loading="loading"
          :error="error"
          :empty="!duas.length"
          empty-icon="i-material-symbols-favorite-rounded"
          empty-title="Belum ada doa"
          empty-description="Doa muncul ketika donatur menuliskan pesan bersama donasinya."
          @retry="refresh()"
        >
          <ul class="space-y-3">
            <li
              v-for="dua in duas"
              :key="dua.id"
              class="rounded-xl border border-default p-4"
              :class="dua.isDuaHidden ? 'bg-muted' : 'bg-default'"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-highlighted">{{ dua.donorName }}</p>
                    <UBadge
                      :label="donationStatuses[dua.status].label"
                      :color="donationStatuses[dua.status].color"
                      variant="subtle"
                    />
                    <UBadge
                      v-if="dua.isDuaHidden"
                      label="Disembunyikan"
                      color="neutral"
                      variant="subtle"
                      icon="i-material-symbols-visibility-off-rounded"
                    />
                  </div>

                  <p class="mt-2 text-toned italic">“{{ dua.message }}”</p>

                  <p class="mt-2 numeric text-xs text-dimmed">
                    {{ formatCurrency(dua.amount) }} ·
                    {{ dua.campaign?.title ?? "Campaign dihapus" }} ·
                    {{ formatRelativeTime(dua.createdAt) }}
                  </p>
                </div>

                <UButton
                  v-if="canModerate"
                  :icon="
                    dua.isDuaHidden
                      ? 'i-material-symbols-visibility-rounded'
                      : 'i-material-symbols-visibility-off-rounded'
                  "
                  :label="dua.isDuaHidden ? 'Tampilkan' : 'Sembunyikan'"
                  :color="dua.isDuaHidden ? 'primary' : 'neutral'"
                  variant="outline"
                  size="sm"
                  :loading="togglingId === dua.id"
                  @click="setVisibility(dua, !dua.isDuaHidden)"
                />
              </div>
            </li>
          </ul>

          <AdminTableFooter
            v-if="meta"
            :meta="meta"
            :size="query.size ?? 15"
            noun="doa"
            @update:page="query.page = $event"
          />
        </AdminDataState>
      </div>
    </UCard>
  </div>
</template>
