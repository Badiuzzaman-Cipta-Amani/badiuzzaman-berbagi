<script setup lang="ts">
import { campaignStatuses } from "~/constants/status"
import {
  deleteAdminCampaignUpdate,
  getDetailAdminUpdateCampaign,
  getPaginateAdminCampaignUpdate,
} from "~/services/admin/content"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const route = useRoute()
const toast = useToast()
const { can } = useAdminAuth()

const id = computed(() => String(route.params.id ?? ""))

const { params: campaignParams, run: runCampaign } = getDetailAdminUpdateCampaign({
  params: { id: id.value },
})
const { data: campaignData, status: campaignStatus, error: campaignError } = runCampaign()

const { query, run } = getPaginateAdminCampaignUpdate({
  query: { size: 10, campaignId: id.value },
})
const { data, status, error, refresh } = run()

// Moving between two campaigns reuses this component, so both requests have to
// follow the route or the second one renders the first one's kabar.
watch(id, (value) => {
  campaignParams.value.id = value
  query.value.campaignId = value
  query.value.page = 1
})

const campaign = computed(() => campaignData.value?.data ?? null)
const updates = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta)

const loadingCampaign = computed(() => campaignStatus.value === "pending")
const loading = computed(() => status.value === "pending")

const canManage = computed(() => can("update.manage"))

/* Delete ------------------------------------------------------------------ */

const confirmOpen = ref(false)
const target = ref<AdminCampaignUpdateItem | null>(null)

const { params: deleteParams, run: runDelete } = deleteAdminCampaignUpdate()
const { execute: removeUpdate, pending: removing } = runDelete()

const askDelete = (item: AdminCampaignUpdateItem) => {
  target.value = item
  confirmOpen.value = true
}

const confirmDelete = async () => {
  if (!target.value) return

  deleteParams.value.id = target.value.id

  try {
    const response = await removeUpdate()
    confirmOpen.value = false
    await refresh()
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch (err) {
    toast.add({
      title: "Kabar tidak dapat dihapus",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Silakan coba lagi.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

useSeoMeta({ title: "Kabar Campaign", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      :title="campaign?.title ?? 'Kabar campaign'"
      description="Seluruh kabar yang sudah dipublikasikan untuk campaign ini, terbaru lebih dulu."
      back-to="/admin/kabar"
      back-label="Kembali ke daftar campaign"
    >
      <template #actions>
        <UButton
          v-if="campaign"
          :to="`/donasi/${campaign.slug}`"
          target="_blank"
          icon="i-material-symbols-open-in-new-rounded"
          label="Lihat publik"
          color="neutral"
          variant="outline"
          size="md"
        />
        <UButton
          v-if="canManage"
          :to="`/admin/kabar/${id}/baru`"
          icon="i-material-symbols-edit-note-rounded"
          label="Tulis kabar"
          color="primary"
          size="md"
        />
      </template>
    </AdminPageHeader>

    <UAlert
      v-if="campaignError"
      color="error"
      variant="subtle"
      icon="i-material-symbols-cloud-off-rounded"
      title="Campaign tidak dapat dimuat"
      description="Data mungkin sudah dihapus, atau koneksi Anda terputus."
      class="mb-6"
    />

    <!-- The campaign this page is about, so the writer never loses the thread. -->
    <div v-else class="mb-6 grid gap-5 sm:grid-cols-3">
      <UCard class="sm:col-span-2">
        <USkeleton v-if="loadingCampaign" class="h-20 w-full rounded-lg" />

        <div v-else-if="campaign" class="flex items-start gap-4">
          <span class="size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
            <CampaignCover :attachment="campaign.cover" :title="campaign.title" />
          </span>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <p class="truncate text-lg font-semibold text-highlighted">
                {{ campaign.title }}
              </p>
              <UBadge
                :label="campaignStatuses[campaign.status].label"
                :color="campaignStatuses[campaign.status].color"
                :icon="campaignStatuses[campaign.status].icon"
                variant="subtle"
              />
            </div>
            <p class="mt-1.5 line-clamp-2 text-sm text-muted">{{ campaign.excerpt }}</p>
          </div>
        </div>
      </UCard>

      <AdminStatCard
        label="Kabar dipublikasikan"
        tone="info"
        :value="formatNumber(campaign?.totalUpdate ?? 0)"
        icon="i-material-symbols-menu-book-rounded"
        :hint="
          campaign?.lastPostedAt
            ? `Terakhir ${formatRelativeTime(campaign.lastPostedAt)}`
            : 'Belum pernah dikabari'
        "
        :loading="loadingCampaign"
      />
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <h3 class="text-lg font-semibold text-highlighted">Daftar kabar</h3>
      </template>

      <div class="p-5 sm:p-6">
        <AdminDataState
          :loading="loading"
          :error="error"
          :empty="!updates.length"
          :skeleton-rows="4"
          empty-icon="i-material-symbols-menu-book-rounded"
          empty-title="Belum ada kabar"
          empty-description="Tulis kabar pertama agar donatur tahu perkembangan program ini."
          @retry="refresh()"
        >
          <!--
            Each row opens its own page rather than a modal: reading and editing
            a long Markdown post is the same job, and it deserves the width.
          -->
          <ul class="space-y-3">
            <li
              v-for="item in updates"
              :key="item.id"
              class="rounded-xl border border-default transition-colors hover:border-primary-200 hover:bg-primary-50/40"
            >
              <div class="flex flex-wrap items-start gap-4 p-5">
                <NuxtLink
                  :to="`/admin/kabar/${id}/${item.id}`"
                  class="min-w-0 flex-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <p class="font-semibold text-highlighted">{{ item.title }}</p>
                  <p class="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                    {{ stripMarkdown(item.description) }}
                  </p>
                  <time class="mt-2 block text-xs text-dimmed" :datetime="item.createdAt">
                    {{ formatDate(item.createdAt) }} ·
                    {{ formatRelativeTime(item.createdAt) }}
                  </time>
                </NuxtLink>

                <div class="flex shrink-0 items-center gap-2">
                  <UButton
                    :to="`/admin/kabar/${id}/${item.id}`"
                    :label="canManage ? 'Ubah' : 'Baca'"
                    :icon="
                      canManage
                        ? 'i-material-symbols-edit-rounded'
                        : 'i-material-symbols-visibility-rounded'
                    "
                    color="neutral"
                    variant="outline"
                    size="md"
                  />
                  <UButton
                    v-if="canManage"
                    icon="i-material-symbols-delete-outline-rounded"
                    color="error"
                    variant="ghost"
                    size="md"
                    :aria-label="`Hapus ${item.title}`"
                    @click="askDelete(item)"
                  />
                </div>
              </div>
            </li>
          </ul>

          <AdminTableFooter
            v-if="meta"
            :meta="meta"
            :size="query.size ?? 10"
            noun="kabar"
            @update:page="query.page = $event"
          />
        </AdminDataState>
      </div>
    </UCard>

    <AdminConfirmModal
      v-model:open="confirmOpen"
      title="Hapus kabar ini?"
      :description="`“${target?.title}” akan hilang dari halaman campaign.`"
      :loading="removing"
      @confirm="confirmDelete"
    />
  </div>
</template>
