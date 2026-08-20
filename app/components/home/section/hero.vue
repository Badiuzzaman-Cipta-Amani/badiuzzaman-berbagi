<script setup lang="ts">
import { getPaginateCampaign } from "~/services/campaign"

const search = ref("")
const { query, run } = getPaginateCampaign({ query: { size: 5 } })
const { data, status } = run()

// The search box is debounced upstream, so this refetches once the typing settles.
watch(search, (value) => {
  query.value.search = value
  query.value.page = 1
})

const suggestions = computed(() =>
  (data.value?.data ?? []).map((campaign) => ({
    label: campaign.title,
    value: campaign.slug,
  })),
)

const onSelect = (item: { value: string }) => navigateTo(`/donasi/${item.value}`)
</script>

<template>
  <section class="relative overflow-hidden bg-primary-900">
    <!-- One light source, top-left, so the navy field has a direction. -->
    <div
      class="pointer-events-none absolute inset-0 bg-radial-[at_15%_0%] from-primary-700/60 to-transparent to-70%"
      aria-hidden="true"
    />

    <div class="relative px-gutter pt-8 pb-9">
      <div class="flex items-center gap-2.5">
        <span
          class="flex size-9 items-center justify-center rounded-xl bg-primary-100/10 ring-1 ring-primary-100/15"
        >
          <UIcon
            name="i-material-symbols-volunteer-activism-rounded"
            class="size-5 text-white"
          />
        </span>
        <span class="text-base font-semibold tracking-tight text-white">
          Badiuzzaman Berbagi
        </span>
      </div>

      <h1
        class="mt-8 text-[2.5rem] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance text-white"
      >
        Mari berbagi kebaikan
      </h1>
      <p class="mt-3 max-w-[36ch] text-sm leading-relaxed text-primary-200">
        Setiap donasi Anda adalah harapan baru bagi mereka yang membutuhkan. Mulai dari
        langkah kecil hari ini.
      </p>

      <BaseFormSearchMenu
        v-model="search"
        :items="suggestions"
        :loading="status === 'pending'"
        variant="outline"
        placeholder="Cari kampanye donasi..."
        class="mt-7"
        @select="onSelect"
      />
    </div>
  </section>
</template>
