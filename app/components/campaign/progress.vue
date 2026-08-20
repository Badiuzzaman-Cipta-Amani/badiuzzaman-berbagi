<script setup lang="ts">
const { campaign } = defineProps<{
  campaign: CampaignListItem
}>()

const deadline = computed(() => {
  if (campaign.daysRemaining === null) return "Tanpa batas waktu"
  if (campaign.daysRemaining < 0) return "Penggalangan telah berakhir"
  if (campaign.daysRemaining === 0) return "Berakhir hari ini"
  return `${campaign.daysRemaining} hari lagi`
})

const reached = computed(() => campaign.progress >= 100)
</script>

<template>
  <section class="rounded-2xl border border-default p-5" aria-label="Perolehan donasi">
    <p class="numeric text-3xl leading-none font-bold tracking-tight text-primary">
      {{ formatCurrency(campaign.raisedAmount) }}
    </p>
    <p class="mt-2 text-sm text-muted">
      terkumpul dari
      <span class="numeric font-semibold text-toned">
        {{ formatCurrency(campaign.targetAmount) }}
      </span>
    </p>

    <UProgress
      :model-value="campaign.progress"
      :color="reached ? 'success' : 'primary'"
      class="mt-4"
      :aria-label="`${campaign.progress} persen dari target`"
    />

    <dl class="mt-4 flex items-center justify-between gap-4 text-sm text-muted">
      <div class="flex items-center gap-1.5">
        <dt class="sr-only">Donatur</dt>
        <UIcon name="i-material-symbols-diversity-3-rounded" class="size-4 text-dimmed" />
        <dd>
          <span class="numeric font-semibold text-toned">
            {{ formatNumber(campaign.totalDonor) }}
          </span>
          donatur
        </dd>
      </div>
      <div class="flex items-center gap-1.5">
        <dt class="sr-only">Sisa waktu</dt>
        <UIcon
          :name="
            reached
              ? 'i-material-symbols-check-circle-rounded'
              : 'i-material-symbols-schedule-rounded'
          "
          class="size-4"
          :class="reached ? 'text-success' : 'text-dimmed'"
        />
        <dd :class="reached ? 'font-semibold text-success' : ''">
          {{ reached ? "Target tercapai" : deadline }}
        </dd>
      </div>
    </dl>
  </section>
</template>
