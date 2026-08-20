<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

import { categoryLabel } from "~/constants/category"
import { donationStatuses } from "~/constants/status"
import { getAdminDashboard } from "~/services/admin/dashboard"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const { query, run } = getAdminDashboard({ query: { days: 30 } })
const { data, status, error, refresh } = run()

const loading = computed(() => status.value === "pending")
const dashboard = computed(() => data.value?.data)
const summary = computed(() => dashboard.value?.summary)

const rangeItems = [
  { label: "7 hari terakhir", value: "7" },
  { label: "30 hari terakhir", value: "30" },
  { label: "90 hari terakhir", value: "90" },
]

/** Month-over-month change; `null` when last month has no basis to compare against. */
const raisedDelta = computed(() => {
  const current = summary.value?.raisedThisMonth ?? 0
  const previous = summary.value?.raisedLastMonth ?? 0

  if (!previous) return null
  return ((current - previous) / previous) * 100
})

const topCategories = computed(() =>
  [...(dashboard.value?.categories ?? [])].sort((a, b) => b.raised - a.raised),
)

const categoryMax = computed(() =>
  Math.max(1, ...topCategories.value.map((row) => row.raised)),
)

const recentColumns: TableColumn<AdminDonationItem>[] = [
  { accessorKey: "donorName", header: "Donatur" },
  { accessorKey: "campaign", header: "Campaign" },
  { accessorKey: "amount", header: "Nominal" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "createdAt", header: "Waktu" },
]

useSeoMeta({ title: "Dashboard Admin", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Dashboard"
      description="Ringkasan donasi, campaign, dan donatur secara keseluruhan."
    >
      <template #actions>
        <div class="w-44">
          <AdminFilterSelect
            :model-value="String(query.days ?? 30)"
            :items="rangeItems"
            icon="i-material-symbols-calendar-month-rounded"
            @update:model-value="query.days = Number($event)"
          />
        </div>
        <UButton
          icon="i-material-symbols-refresh-rounded"
          label="Muat ulang"
          color="neutral"
          variant="outline"
          size="md"
          :loading="loading"
          @click="refresh()"
        />
      </template>
    </AdminPageHeader>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      icon="i-material-symbols-cloud-off-rounded"
      title="Gagal memuat statistik"
      description="Periksa koneksi Anda, lalu coba lagi."
      class="mb-5"
      :actions="[
        {
          label: 'Coba lagi',
          color: 'error',
          variant: 'solid',
          onClick: () => refresh(),
        },
      ]"
    />

    <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <AdminStatCard
        label="Dana terkumpul"
        tone="success"
        :value="formatCurrency(summary?.totalRaised ?? 0)"
        icon="i-material-symbols-volunteer-activism-rounded"
        :delta="raisedDelta"
        :hint="`${formatCurrency(summary?.raisedThisMonth ?? 0)} bulan ini`"
        :loading="loading"
      />
      <AdminStatCard
        label="Menunggu verifikasi"
        tone="warning"
        :value="formatNumber(summary?.pendingDonation ?? 0)"
        icon="i-material-symbols-hourglass-top-rounded"
        :hint="`${formatCurrency(summary?.pendingAmount ?? 0)} tertahan`"
        to="/admin/donasi?status=pending"
        :loading="loading"
      />
      <AdminStatCard
        label="Campaign aktif"
        tone="info"
        :value="formatNumber(summary?.activeCampaign ?? 0)"
        icon="i-material-symbols-mosque-rounded"
        :hint="`dari ${formatNumber(summary?.totalCampaign ?? 0)} campaign`"
        to="/admin/campaign"
        :loading="loading"
      />
      <AdminStatCard
        label="Donatur terdaftar"
        tone="primary"
        :value="formatNumber(summary?.totalUser ?? 0)"
        icon="i-material-symbols-diversity-3-rounded"
        :hint="`+${formatNumber(summary?.newUserThisMonth ?? 0)} bulan ini`"
        to="/admin/donatur"
        :loading="loading"
      />
    </div>

    <div class="mt-6 grid gap-5 xl:grid-cols-3">
      <div class="xl:col-span-2">
        <AdminTrendChart :points="dashboard?.trend ?? []" :loading="loading" />
      </div>

      <AdminCampaignStatusCard
        :rows="dashboard?.campaignStatus ?? []"
        :total-donation="summary?.totalDonation ?? 0"
        :total-fundraiser="summary?.totalFundraiser ?? 0"
        :loading="loading"
      />
    </div>

    <div class="mt-6 grid gap-5 xl:grid-cols-2">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-highlighted">Perolehan per kategori</h3>
        </template>

        <USkeleton v-if="loading" class="h-48 w-full rounded-lg" />

        <ul v-else-if="topCategories.length" class="space-y-3.5">
          <li v-for="row in topCategories" :key="row.category">
            <div class="flex items-baseline justify-between gap-3 text-sm">
              <span class="truncate font-medium text-toned">
                {{ categoryLabel(row.category) }}
              </span>
              <span class="shrink-0 numeric font-semibold text-highlighted">
                {{ formatCurrencyShort(row.raised) }}
              </span>
            </div>
            <UProgress
              :model-value="(row.raised / categoryMax) * 100"
              size="sm"
              color="primary"
              class="mt-1.5"
            />
            <p class="mt-1 text-xs text-dimmed">
              {{ formatNumber(row.campaignCount) }} campaign
            </p>
          </li>
        </ul>

        <p v-else class="py-6 text-center text-sm text-muted">Belum ada data kategori.</p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-lg font-semibold text-highlighted">Campaign teratas</h3>
            <UButton
              to="/admin/campaign"
              label="Lihat semua"
              color="neutral"
              variant="link"
              size="sm"
            />
          </div>
        </template>

        <USkeleton v-if="loading" class="h-48 w-full rounded-lg" />

        <ul v-else-if="dashboard?.topCampaigns.length" class="space-y-4">
          <li
            v-for="campaign in dashboard.topCampaigns"
            :key="campaign.slug"
            class="rounded-xl border border-default p-3.5"
          >
            <div class="flex items-start justify-between gap-3">
              <p class="min-w-0 flex-1 truncate text-sm font-semibold text-highlighted">
                {{ campaign.title }}
              </p>
              <UBadge
                :label="`${campaign.progress}%`"
                :color="campaign.progress >= 100 ? 'success' : 'primary'"
                variant="subtle"
                size="sm"
                class="shrink-0 numeric"
              />
            </div>

            <!--
              Terkumpul vs target is the number an operator is actually looking
              for, so it is the largest thing in the row — not a footnote under
              the progress bar.
            -->
            <div class="mt-2.5 flex items-end justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs text-muted">Terkumpul</p>
                <p class="numeric text-lg leading-tight font-bold text-primary">
                  {{ formatCurrency(campaign.raisedAmount) }}
                </p>
              </div>
              <div class="min-w-0 text-end">
                <p class="text-xs text-muted">Target</p>
                <p class="numeric text-base leading-tight font-semibold text-toned">
                  {{ formatCurrency(campaign.targetAmount) }}
                </p>
              </div>
            </div>

            <UProgress
              :model-value="campaign.progress"
              size="md"
              :color="campaign.progress >= 100 ? 'success' : 'primary'"
              class="mt-2.5"
            />

            <p class="mt-2 flex items-center gap-1.5 text-xs text-dimmed">
              <UIcon name="i-material-symbols-diversity-3-rounded" class="size-3.5" />
              <span class="numeric">{{ formatNumber(campaign.totalDonor) }}</span>
              donatur · kurang
              <span class="numeric font-medium text-muted">
                {{
                  formatCurrencyShort(
                    Math.max(0, campaign.targetAmount - campaign.raisedAmount),
                  )
                }}
              </span>
            </p>
          </li>
        </ul>

        <p v-else class="py-6 text-center text-sm text-muted">Belum ada campaign.</p>
      </UCard>
    </div>

    <UCard class="mt-6">
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-lg font-semibold text-highlighted">Donasi terbaru</h3>
          <UButton
            to="/admin/donasi"
            label="Kelola donasi"
            color="neutral"
            variant="link"
            size="sm"
          />
        </div>
      </template>

      <USkeleton v-if="loading" class="h-56 w-full rounded-lg" />

      <div
        v-else-if="dashboard?.recentDonations.length"
        class="-mx-5 overflow-x-auto sm:mx-0"
      >
        <UTable
          :data="dashboard.recentDonations"
          :columns="recentColumns"
          class="w-full min-w-2xl"
        >
          <template #donorName-cell="{ row }">
            <span class="font-medium text-toned">{{ row.original.donorName }}</span>
          </template>

          <template #campaign-cell="{ row }">
            <span class="line-clamp-1 max-w-52 text-muted">
              {{ row.original.campaign?.title ?? "—" }}
            </span>
          </template>

          <template #amount-cell="{ row }">
            <span class="numeric font-semibold text-highlighted">
              {{ formatCurrency(row.original.amount) }}
            </span>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :label="donationStatuses[row.original.status].label"
              :color="donationStatuses[row.original.status].color"
              :icon="donationStatuses[row.original.status].icon"
              variant="subtle"
            />
          </template>

          <template #createdAt-cell="{ row }">
            <span class="text-muted">{{
              formatRelativeTime(row.original.createdAt)
            }}</span>
          </template>
        </UTable>
      </div>

      <p v-else class="py-6 text-center text-sm text-muted">Belum ada donasi masuk.</p>
    </UCard>
  </div>
</template>
