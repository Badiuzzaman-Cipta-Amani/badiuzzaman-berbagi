<script setup lang="ts">
import type { DetailTab } from "~/components/detail/tabs.vue"

import { categoryLabel } from "~/constants/category"
import {
  getDetailCampaign,
  getListCampaignUpdate,
  getPaginateCampaignDua,
  postDonateCampaign,
} from "~/services/campaign"

definePageMeta({
  layout: "detail",
})

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ""))

const { params: detailParams, run: runDetail } = getDetailCampaign({
  params: { slug: slug.value },
})
const { data: detailData, status: detailStatus, error: detailError } = runDetail()

const { params: updateParams, run: runUpdates } = getListCampaignUpdate({
  params: { slug: slug.value },
})
const { data: updateData, status: updateStatus } = runUpdates()

const {
  params: duaParams,
  query: duaQuery,
  run: runDuas,
} = getPaginateCampaignDua({ params: { slug: slug.value }, query: { size: 10 } })
const { data: duaData, status: duaStatus } = runDuas()

// The feed grows as the reader scrolls, so each page is kept rather than swapped.
const {
  items: duas,
  meta: duaMeta,
  loading: duaLoading,
  loadingMore: duaLoadingMore,
  hasMore: duaHasMore,
  loadMore: loadMoreDuas,
  reset: resetDuas,
} = useInfiniteList({
  query: duaQuery,
  data: () => duaData.value,
  status: () => duaStatus.value,
})

// One route param drives three requests; keep them in step on client-side navigation.
watch(slug, (value) => {
  detailParams.value.slug = value
  updateParams.value.slug = value
  duaParams.value.slug = value
  resetDuas()
})

const campaign = computed(() => detailData.value?.data ?? null)
const updates = computed(() => updateData.value?.data ?? [])
const latestUpdate = computed(() => updates.value[0] ?? null)

const activeTab = ref<DetailTab>("description")
const activeMedia = ref<Attachment | null>(null)
const showDonationModal = ref(false)
const showMediaModal = ref(false)
const showQRModal = ref(false)
/** The receipt the donate endpoint just issued — it carries the donor's reference. */
const receipt = ref<DonationReceipt | null>(null)

const toast = useToast()

const { params: donateParams, run: runDonate } = postDonateCampaign({
  params: { slug: slug.value },
})
const { execute: donate, pending: donating } = runDonate()

watch(slug, (value) => (donateParams.value.slug = value))

const openMedia = (media: Attachment) => {
  activeMedia.value = media
  showMediaModal.value = true
}

const submitDonation = async (payload: DonateCampaign["body"]) => {
  try {
    const response = await donate({ body: payload })

    receipt.value = response.data
    showDonationModal.value = false
    showQRModal.value = true
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })

    // The new dua only exists server-side, and it lands at the top of the feed —
    // so the accumulated pages are dropped and the list is rebuilt from page 1.
    resetDuas()
    await refreshNuxtData()
  } catch (error) {
    toast.add({
      title: "Donasi gagal diproses",
      description:
        (error as { statusMessage?: string }).statusMessage ??
        "Coba ulangi beberapa saat lagi.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

watchEffect(() => {
  if (!campaign.value) return

  usePageSeo({
    title: campaign.value.title,
    description: campaign.value.excerpt,
    image: campaign.value.cover?.url,
    type: "article",
  })
})
</script>

<template>
  <main class="pb-28">
    <LayoutBackHeader title="Detail donasi" />

    <div v-if="detailStatus === 'pending'">
      <USkeleton class="h-64 w-full rounded-none" />
      <div class="px-gutter py-5">
        <USkeleton class="h-5 w-24 rounded-full" />
        <USkeleton class="mt-4 h-7 w-4/5" />
        <USkeleton class="mt-2 h-7 w-3/5" />
        <USkeleton class="mt-6 h-40 w-full rounded-2xl" />
      </div>
    </div>

    <div v-else-if="campaign">
      <DetailMediaCarousel
        :media="campaign.media"
        :title="campaign.title"
        @open="openMedia"
      />

      <div class="px-gutter py-5">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            :label="categoryLabel(campaign.category)"
            color="primary"
            variant="subtle"
          />
          <UBadge
            v-if="campaign.verifiedAt"
            label="Terverifikasi"
            color="success"
            variant="subtle"
            icon="i-material-symbols-verified-rounded"
          />
          <UBadge
            v-if="campaign.isUrgent"
            label="Mendesak"
            color="error"
            variant="subtle"
            icon="i-material-symbols-schedule-rounded"
          />
        </div>

        <h1
          class="mt-3 mb-5 text-2xl leading-snug font-bold tracking-tight text-balance text-highlighted"
        >
          {{ campaign.title }}
        </h1>

        <CampaignProgress :campaign="campaign" />

        <div class="mt-7">
          <DetailTabs v-model:active-tab="activeTab" />

          <DetailDescriptionTab
            v-if="activeTab === 'description'"
            :description="campaign.description"
            :latest-update="latestUpdate"
          />

          <DetailDocumentationTab
            v-else-if="activeTab === 'documentation'"
            :media="campaign.media"
            :title="campaign.title"
            @open="openMedia"
          />

          <DetailUpdateList
            v-else
            :updates="updates"
            :loading="updateStatus === 'pending'"
          />
        </div>

        <div class="mt-8">
          <DetailFundraiserCard :campaign="campaign" />
        </div>

        <!--
          The dua feed closes the page rather than hiding behind a tab: it is
          the social proof a donor reads last, right above the donate bar.
        -->
        <section class="mt-9" aria-labelledby="dua-heading">
          <div class="mb-4 flex items-baseline justify-between gap-3">
            <h2
              id="dua-heading"
              class="text-lg leading-tight font-bold tracking-tight text-highlighted"
            >
              Doa dari donatur
            </h2>
            <span v-if="duaMeta?.totalCount" class="shrink-0 text-sm text-muted">
              <span class="numeric font-semibold text-toned">
                {{ formatNumber(duaMeta.totalCount) }}
              </span>
              doa
            </span>
          </div>

          <DetailDuaList
            :duas="duas"
            :loading="duaLoading"
            :loading-more="duaLoadingMore"
            :has-more="duaHasMore"
            @load-more="loadMoreDuas"
          />
        </section>
      </div>

      <DetailFooterCTA :title="campaign.title" @donate="showDonationModal = true" />

      <ModalsDonationModal
        v-model:open="showDonationModal"
        :campaign-title="campaign.title"
        :pending="donating"
        @submit="submitDonation"
      />

      <ModalsQRCodeModal
        v-if="receipt"
        v-model:open="showQRModal"
        :donation="receipt"
        :campaign-title="campaign.title"
      />

      <ModalsMediaLightboxModal v-model:open="showMediaModal" :media="activeMedia" />
    </div>

    <UEmpty
      v-else
      :icon="
        detailError?.statusCode === 404
          ? 'i-material-symbols-search-off-rounded'
          : 'i-material-symbols-cloud-off-rounded'
      "
      :title="
        detailError?.statusCode === 404
          ? 'Program tidak ditemukan'
          : 'Gagal memuat program'
      "
      :description="
        detailError?.statusCode === 404
          ? 'Program ini mungkin sudah ditutup atau tautannya keliru.'
          : 'Periksa koneksi Anda, lalu coba lagi.'
      "
      :actions="[{ label: 'Kembali ke daftar', color: 'primary', to: '/donasi' }]"
      class="mt-10"
    />
  </main>
</template>
