<script setup lang="ts">
import { categoryLabel } from "~/constants/category"
import { getCriticalCampaign } from "~/services/campaign"

const { run } = getCriticalCampaign()
const { data, status } = run()

const campaign = computed(() => data.value?.data ?? null)

const countdown = computed(() => {
  const days = campaign.value?.daysRemaining
  if (days === null || days === undefined) return null
  if (days <= 0) return "Berakhir hari ini"
  return `${days} hari lagi`
})
</script>

<template>
  <section v-if="status === 'pending' || campaign" class="px-gutter pt-7">
    <h2 class="mb-4 text-lg leading-tight font-bold tracking-tight text-highlighted">
      Prioritas
    </h2>

    <div
      v-if="status === 'pending'"
      class="overflow-hidden rounded-2xl border border-default"
    >
      <USkeleton class="h-52 w-full rounded-none" />
      <div class="p-5">
        <USkeleton class="h-5 w-4/5" />
        <USkeleton class="mt-3 h-6 w-1/2" />
        <USkeleton class="mt-4 h-2 w-full" />
        <USkeleton class="mt-4 h-4 w-2/3" />
      </div>
    </div>

    <NuxtLink
      v-else-if="campaign"
      :to="`/donasi/${campaign.slug}`"
      class="group block overflow-hidden rounded-2xl border border-default bg-default shadow-sm transition-shadow duration-200 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div class="relative h-52 bg-muted">
        <CampaignCover :attachment="campaign.cover" :title="campaign.title" />
        <UBadge
          v-if="countdown"
          :label="countdown"
          color="error"
          variant="solid"
          icon="i-material-symbols-schedule-rounded"
          class="absolute top-3 left-3 shadow-sm"
        />
      </div>

      <div class="p-5">
        <div class="flex items-center gap-2 text-xs text-muted">
          <span>{{ categoryLabel(campaign.category) }}</span>
          <span class="size-1 rounded-full bg-accented" aria-hidden="true" />
          <span>
            <span class="numeric">{{ formatNumber(campaign.totalDonor) }}</span> donatur
          </span>
        </div>

        <h3
          class="mt-2 line-clamp-2 text-lg leading-snug font-bold text-highlighted transition-colors group-hover:text-primary"
        >
          {{ campaign.title }}
        </h3>

        <div class="mt-4 flex items-baseline justify-between gap-3">
          <p class="numeric text-xl font-bold text-primary">
            {{ formatCurrency(campaign.raisedAmount) }}
          </p>
          <p class="numeric text-xs text-muted">
            dari {{ formatCurrency(campaign.targetAmount) }}
          </p>
        </div>

        <UProgress
          :model-value="campaign.progress"
          color="primary"
          class="mt-3"
          :aria-label="`${campaign.progress} persen dari target`"
        />

        <p
          class="mt-5 flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5"
        >
          Lihat program
          <UIcon
            name="i-material-symbols-arrow-forward-rounded"
            class="size-4 transition-[margin]"
          />
        </p>
      </div>
    </NuxtLink>
  </section>
</template>
