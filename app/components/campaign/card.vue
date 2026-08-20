<script setup lang="ts">
import { categoryLabel } from "~/constants/category"

const { campaign, compact = false } = defineProps<{
  campaign: CampaignListItem
  compact?: boolean
}>()

const deadline = computed(() => {
  if (campaign.daysRemaining === null) return "Tanpa batas waktu"
  if (campaign.daysRemaining < 0) return "Sudah berakhir"
  if (campaign.daysRemaining === 0) return "Berakhir hari ini"
  return `${campaign.daysRemaining} hari lagi`
})
</script>

<template>
  <NuxtLink
    :to="`/donasi/${campaign.slug}`"
    class="group block overflow-hidden rounded-2xl border border-default bg-default transition-shadow duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
  >
    <!--
      The title lives on the card body, never over the photograph: white text on
      an arbitrary donor image cannot be held to a contrast ratio.
    -->
    <div class="relative bg-muted" :class="compact ? 'h-32' : 'h-44'">
      <CampaignCover :attachment="campaign.cover" :title="campaign.title" />
      <div class="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
        <UBadge
          :label="categoryLabel(campaign.category)"
          color="neutral"
          variant="solid"
          size="sm"
          class="bg-default/90 text-toned backdrop-blur-sm"
        />
        <UBadge
          v-if="campaign.isUrgent"
          label="Mendesak"
          color="error"
          variant="solid"
          size="sm"
          icon="i-material-symbols-schedule-rounded"
        />
      </div>
    </div>

    <div class="p-4">
      <h3
        class="line-clamp-2 leading-snug font-semibold text-highlighted transition-colors group-hover:text-primary"
        :class="compact ? 'text-sm' : 'text-base'"
      >
        {{ campaign.title }}
      </h3>

      <p
        class="mt-3 numeric font-bold text-primary"
        :class="compact ? 'text-sm' : 'text-lg'"
      >
        {{ formatCurrency(campaign.raisedAmount) }}
      </p>
      <p class="mt-0.5 numeric text-xs text-muted">
        dari {{ formatCurrency(campaign.targetAmount) }}
      </p>

      <UProgress
        :model-value="campaign.progress"
        :color="campaign.progress >= 100 ? 'success' : 'primary'"
        size="sm"
        class="mt-3"
        :aria-label="`${campaign.progress} persen dari target`"
      />

      <div class="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
        <span class="flex items-center gap-1">
          <UIcon
            name="i-material-symbols-diversity-3-rounded"
            class="size-3.5 text-dimmed"
          />
          <span class="numeric">{{ formatNumber(campaign.totalDonor) }}</span> donatur
        </span>
        <span
          class="flex items-center gap-1"
          :class="campaign.isUrgent ? 'font-medium text-error' : ''"
        >
          <UIcon name="i-material-symbols-schedule-rounded" class="size-3.5" />
          {{ deadline }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
