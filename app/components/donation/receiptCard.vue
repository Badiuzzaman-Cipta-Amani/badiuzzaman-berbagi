<script setup lang="ts">
import { donationStatuses } from "~/constants/status"

/**
 * One donation as its donor reads it — the same card in the history list and on
 * the public tracking page, so a donor never has to learn two layouts for the
 * same fact.
 *
 * The status is the point of the card, so it carries a sentence explaining what
 * the donor should do next rather than a bare badge they have to interpret.
 */
const { donation, compact = false } = defineProps<{
  donation: DonationReceipt
  /** Drops the "what happens next" block, for the list view. */
  compact?: boolean
}>()

const presentation = computed(() => donationStatuses[donation.status])

const nextStep = computed(() => {
  if (donation.status === "verified") {
    return "Donasi Anda sudah diverifikasi dan tercatat pada perolehan program."
  }

  if (donation.status === "rejected") {
    return (
      donation.reviewNote ??
      "Donasi ini tidak dapat diverifikasi. Hubungi kami bila Anda merasa ini keliru."
    )
  }

  return donation.confirmedAt
    ? "Bukti transfer sudah kami terima. Tim kami memverifikasinya secara manual, biasanya dalam 1x24 jam."
    : "Selesaikan transfer, lalu kirim bukti pembayaran agar donasi Anda dapat diverifikasi."
})
</script>

<template>
  <article class="rounded-2xl border border-default p-5">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs font-semibold tracking-wide text-muted uppercase">
          Kode donasi
        </p>
        <p class="mt-0.5 numeric text-lg font-bold tracking-wide text-highlighted">
          {{ donation.reference }}
        </p>
      </div>

      <UBadge
        :label="presentation.label"
        :color="presentation.color"
        :icon="presentation.icon"
        variant="subtle"
        class="shrink-0"
      />
    </div>

    <NuxtLink
      v-if="donation.campaign"
      :to="`/donasi/${donation.campaign.slug}`"
      class="mt-4 flex items-center gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <span class="size-12 shrink-0 overflow-hidden rounded-lg">
        <CampaignCover
          :attachment="donation.campaign.cover"
          :title="donation.campaign.title"
        />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-xs text-muted">Program</span>
        <span class="line-clamp-2 text-sm font-semibold text-highlighted">
          {{ donation.campaign.title }}
        </span>
      </span>
      <UIcon
        name="i-material-symbols-chevron-right-rounded"
        class="size-5 shrink-0 text-dimmed"
      />
    </NuxtLink>

    <dl class="mt-4 grid grid-cols-2 gap-4 border-t border-default pt-4">
      <div>
        <dt class="text-xs text-muted">Nominal</dt>
        <dd class="mt-0.5 numeric text-xl font-bold text-highlighted">
          {{ formatCurrency(donation.amount) }}
        </dd>
      </div>
      <div>
        <dt class="text-xs text-muted">Tanggal</dt>
        <dd class="mt-0.5 text-sm font-medium text-toned">
          {{ formatDate(donation.createdAt) }}
        </dd>
      </div>
      <div class="col-span-2">
        <dt class="text-xs text-muted">Atas nama</dt>
        <!-- Numbered once there is more than one name, so a donor can check the
             roster their certificate will carry rather than a run-on line. -->
        <dd class="mt-0.5 text-sm font-medium text-toned">
          <ol
            v-if="donation.donorNames.length > 1"
            class="list-inside list-decimal space-y-0.5"
          >
            <li v-for="(name, index) in donation.donorNames" :key="index">{{ name }}</li>
          </ol>
          <template v-else>{{ donation.donorName }}</template>
        </dd>
      </div>
    </dl>

    <p v-if="donation.message" class="mt-4 text-sm leading-relaxed text-muted italic">
      “{{ donation.message }}”
    </p>

    <div
      v-if="!compact"
      class="mt-4 flex gap-2.5 rounded-xl bg-muted p-4"
      :class="donation.status === 'rejected' ? 'text-error' : 'text-toned'"
    >
      <UIcon :name="presentation.icon" class="mt-0.5 size-5 shrink-0" />
      <p class="text-sm leading-relaxed">{{ nextStep }}</p>
    </div>
  </article>
</template>
