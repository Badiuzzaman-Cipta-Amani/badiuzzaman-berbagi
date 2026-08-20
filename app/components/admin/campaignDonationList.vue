<script setup lang="ts">
import { donationStatuses } from "~/constants/status"
import { getPaginateAdminDonation } from "~/services/admin/donation"

/**
 * The last few donations to one campaign, on the campaign's own detail page.
 *
 * It is a child rather than a block on the page because the donation endpoint
 * filters by campaign *slug*, which the page only knows once its own request has
 * landed — mounting this behind `v-if` lets the service start with the right
 * filter instead of firing once with none.
 */
const { slug } = defineProps<{ slug: string }>()

const { query, run } = getPaginateAdminDonation({ query: { size: 5, campaign: slug } })
const { data, status, error, refresh } = run()

watch(
  () => slug,
  (value) => (query.value.campaign = value),
)

const donations = computed(() => data.value?.data ?? [])
const loading = computed(() => status.value === "pending")
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold text-highlighted">Donasi terbaru</h3>
    </template>

    <AdminDataState
      :loading="loading"
      :error="error"
      :empty="!donations.length"
      :skeleton-rows="3"
      empty-icon="i-material-symbols-volunteer-activism-rounded"
      empty-title="Belum ada donasi"
      empty-description="Donasi yang masuk untuk campaign ini akan muncul di sini."
      @retry="refresh()"
    >
      <!-- A fixed slice, not a paged query — so a plain list, not `UTable`. -->
      <ul class="divide-y divide-default">
        <li
          v-for="donation in donations"
          :key="donation.id"
          class="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-highlighted">{{ donation.donorName }}</p>
            <p class="mt-0.5 numeric text-xs text-muted">
              {{ donation.reference }} · {{ formatRelativeTime(donation.createdAt) }}
            </p>
          </div>

          <span class="numeric font-semibold text-highlighted">
            {{ formatCurrency(donation.amount) }}
          </span>

          <UBadge
            :label="donationStatuses[donation.status].label"
            :color="donationStatuses[donation.status].color"
            :icon="donationStatuses[donation.status].icon"
            variant="subtle"
          />

          <UButton
            :to="`/admin/donasi/${donation.id}`"
            icon="i-material-symbols-chevron-right-rounded"
            color="neutral"
            variant="ghost"
            size="sm"
            :aria-label="`Detail donasi ${donation.reference}`"
          />
        </li>
      </ul>
    </AdminDataState>

    <template #footer>
      <UButton
        :to="`/admin/donasi?campaign=${slug}`"
        label="Semua donasi campaign ini"
        trailing-icon="i-material-symbols-arrow-forward-rounded"
        color="neutral"
        variant="outline"
        size="md"
      />
    </template>
  </UCard>
</template>
