<script setup lang="ts">
import { categories } from "~/constants/category"
import { sortLabel, sortOptions } from "~/constants/sort"
import { getPaginateCampaign } from "~/services/campaign"

definePageMeta({
  layout: "default",
})

const route = useRoute()
const router = useRouter()

// `kategori` in the URL is the enum key, so deep links from the category grid work.
const initialCategory =
  categories.find((item) => item.key === route.query.kategori)?.key ?? ""

const { query, run } = getPaginateCampaign({
  query: { category: initialCategory, size: 10 },
})
const { data, status, error, refresh } = run()

const search = ref(query.value.search ?? "")

// Category and sorting are two separate decisions, so they get two separate
// sheets — opening one no longer puts the other in front of the user.
const showCategory = ref(false)
const showSort = ref(false)

// The list grows on scroll instead of paging: every page that has been read
// stays on screen, and changing a filter drops the pile and starts over.
const {
  items: campaigns,
  meta,
  loading,
  loadingMore,
  hasMore,
  loadMore,
} = useInfiniteList({
  query,
  data: () => data.value,
  status: () => status.value,
})

const activeCategory = computed(() =>
  categories.find((item) => item.key === query.value.category),
)

const hasFilters = computed(
  () =>
    Boolean(query.value.category) ||
    Boolean(query.value.search) ||
    (query.value.sort ?? "latest") !== "latest",
)

const categoryItems = [
  { label: "Semua kategori", value: "" },
  ...categories.map((item) => ({ label: item.name, value: item.key })),
]

const sortItems = sortOptions.map((option) => ({
  label: option.label,
  value: option.value,
}))

/**
 * Both sheets commit through here. Neither touches `page`: `useInfiniteList`
 * watches every other field and rewinds the list itself when one of them moves.
 */
const applyCategory = (value: string) => {
  query.value.category = value as CampaignCategory | ""
}

const applySort = (value: string) => {
  query.value.sort = value as CampaignSortOption
}

/** Filters live in the URL so the list survives a refresh or a shared link. */
watch(
  () => query.value.category,
  (category) => {
    router.replace({ query: { ...route.query, kategori: category || undefined } })
  },
)

// Debounced so typing does not fire a request per keystroke.
watchDebounced(
  search,
  (value) => {
    query.value.search = value
  },
  { debounce: 350 },
)

const resetFilters = () => {
  search.value = ""
  query.value = { page: 1, size: 10, search: "", category: "", sort: "latest" }
}

usePageSeo({
  title: "Daftar Program Donasi",
  description:
    "Temukan berbagai program donasi mulai dari sumur bor, pondok pesantren, anak yatim, sosial, masjid, dan pendidikan. Salurkan kebaikan Anda sekarang.",
  type: "website",
})
</script>

<template>
  <!--
    The page is a fixed column so the results can own the only scroll region on
    it: an infinite list needs a container with a height to listen to, and the
    search and the filters have to stay reachable while that list grows.
  -->
  <main class="flex h-[100dvh] flex-col">
    <LayoutBackHeader title="Daftar donasi" class="shrink-0" />

    <div class="shrink-0 border-b border-default bg-default px-gutter py-3">
      <UInput
        v-model="search"
        icon="i-material-symbols-search-rounded"
        placeholder="Cari program donasi..."
        class="w-full"
        :ui="{ base: 'rounded-xl' }"
      >
        <template v-if="search" #trailing>
          <UButton
            icon="i-material-symbols-close-rounded"
            color="neutral"
            variant="link"
            size="sm"
            aria-label="Hapus pencarian"
            @click="search = ''"
          />
        </template>
      </UInput>

      <div class="mt-2.5 flex items-center gap-2">
        <UButton
          icon="i-material-symbols-category-rounded"
          trailing-icon="i-material-symbols-expand-more-rounded"
          :label="activeCategory?.name ?? 'Semua kategori'"
          :color="query.category ? 'primary' : 'neutral'"
          :variant="query.category ? 'subtle' : 'outline'"
          size="md"
          class="min-w-0 flex-1 justify-between"
          :ui="{ label: 'truncate' }"
          @click="showCategory = true"
        />
        <UButton
          icon="i-material-symbols-sort-rounded"
          trailing-icon="i-material-symbols-expand-more-rounded"
          :label="sortLabel(query.sort ?? 'latest')"
          :color="(query.sort ?? 'latest') !== 'latest' ? 'primary' : 'neutral'"
          :variant="(query.sort ?? 'latest') !== 'latest' ? 'subtle' : 'outline'"
          size="md"
          class="min-w-0 flex-1 justify-between"
          :ui="{ label: 'truncate' }"
          @click="showSort = true"
        />
      </div>
    </div>

    <BaseInfiniteScroll
      class="flex-1 pb-28"
      :has-more="hasMore"
      :loading="loadingMore"
      @load-more="loadMore"
    >
      <p v-if="!loading && !error" class="px-gutter pt-4 text-sm text-muted">
        <span class="numeric font-semibold text-toned">{{ meta?.totalCount ?? 0 }}</span>
        program ditemukan
      </p>

      <div v-if="loading" class="space-y-3 px-gutter py-4">
        <CampaignCardSkeleton v-for="n in 4" :key="n" />
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        variant="subtle"
        icon="i-material-symbols-cloud-off-rounded"
        title="Gagal memuat program donasi"
        description="Periksa koneksi Anda, lalu coba lagi."
        class="mx-gutter mt-4"
        :actions="[
          {
            label: 'Coba lagi',
            color: 'error',
            variant: 'solid',
            onClick: () => refresh(),
          },
        ]"
      />

      <UEmpty
        v-else-if="!campaigns.length"
        icon="i-material-symbols-search-off-rounded"
        title="Tidak ada program yang cocok"
        :description="
          hasFilters
            ? 'Coba ubah kata kunci atau lepas sebagian filter.'
            : 'Program baru akan tampil di sini begitu dibuka.'
        "
        :actions="
          hasFilters
            ? [
                {
                  label: 'Reset filter',
                  color: 'neutral',
                  variant: 'outline',
                  onClick: resetFilters,
                },
              ]
            : []
        "
        class="mt-6"
      />

      <template v-else>
        <ul class="space-y-3 px-gutter py-4">
          <li v-for="campaign in campaigns" :key="campaign.slug">
            <CampaignCard :campaign="campaign" />
          </li>
        </ul>

        <!-- Only worth saying once the reader has actually pulled a second page. -->
        <p
          v-if="!hasMore && meta && meta.pageCount > 1"
          class="px-gutter text-center text-xs text-dimmed"
        >
          Semua program sudah ditampilkan.
        </p>
      </template>
    </BaseInfiniteScroll>

    <CampaignFilterDrawer
      v-model:open="showCategory"
      title="Kategori"
      description="Pilih satu kategori, lalu tekan Terapkan untuk memuat ulang daftar."
      :items="categoryItems"
      :model-value="query.category ?? ''"
      @apply="applyCategory"
    />

    <CampaignFilterDrawer
      v-model:open="showSort"
      title="Urutkan"
      description="Pilih urutan tampilan, lalu tekan Terapkan untuk memuat ulang daftar."
      :items="sortItems"
      :model-value="query.sort ?? 'latest'"
      neutral-value="latest"
      @apply="applySort"
    />
  </main>
</template>
