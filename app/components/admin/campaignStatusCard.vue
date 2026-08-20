<script setup lang="ts">
import { campaignStatuses } from "~/constants/status"

/**
 * The campaign portfolio as one shape rather than four numbers in a column: the
 * ring shows the mix, the centre shows the total, and each status keeps the
 * colour it already carries in every badge on the site — so a reader who knows
 * "amber means waiting" does not have to relearn it here.
 */
const props = defineProps<{
  rows: AdminDashboardStatus[]
  totalDonation: number
  totalFundraiser: number
  loading?: boolean
}>()

/** Same hues as the badge colours in `app.config.ts`, as literal values Unovis can paint. */
const STATUS_COLOR: Record<CampaignStatus, string> = {
  draft: "var(--color-slate-400)",
  active: "var(--color-emerald-500)",
  completed: "var(--color-sky-500)",
  cancelled: "var(--color-red-500)",
}

const total = computed(() => props.rows.reduce((sum, row) => sum + row.count, 0))

const series = computed(() => props.rows.map((row) => row.count))

const categories = computed(() =>
  Object.fromEntries(
    props.rows.map((row, index) => [
      index,
      {
        name: campaignStatuses[row.status].label,
        color: STATUS_COLOR[row.status],
      },
    ]),
  ),
)

const share = (count: number) =>
  total.value ? Math.round((count / total.value) * 100) : 0
</script>

<template>
  <UCard class="h-full">
    <template #header>
      <h3 class="text-base font-semibold text-highlighted">Status campaign</h3>
    </template>

    <USkeleton v-if="loading" class="h-56 w-full rounded-lg" />

    <template v-else-if="total">
      <div class="relative mx-auto w-fit">
        <DonutChart
          :data="series"
          :categories="categories"
          :height="180"
          :radius="90"
          :arc-width="22"
          :pad-angle="0.02"
          hide-legend
        />
        <!-- The centre of a donut is wasted unless it answers "of how many?" -->
        <div
          class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        >
          <span class="numeric text-2xl font-bold text-highlighted">
            {{ formatNumber(total) }}
          </span>
          <span class="text-xs text-muted">campaign</span>
        </div>
      </div>

      <ul class="mt-5 space-y-2.5">
        <li
          v-for="row in rows"
          :key="row.status"
          class="flex items-center justify-between gap-3"
        >
          <span class="flex min-w-0 items-center gap-2 text-sm text-toned">
            <span
              class="size-2.5 shrink-0 rounded-full"
              :style="{ backgroundColor: STATUS_COLOR[row.status] }"
              aria-hidden="true"
            />
            <UIcon :name="campaignStatuses[row.status].icon" class="size-4 text-dimmed" />
            <span class="truncate">{{ campaignStatuses[row.status].label }}</span>
          </span>

          <span class="flex shrink-0 items-baseline gap-1.5">
            <span class="numeric text-sm font-semibold text-highlighted">
              {{ formatNumber(row.count) }}
            </span>
            <span class="numeric text-xs text-dimmed">{{ share(row.count) }}%</span>
          </span>
        </li>
      </ul>
    </template>

    <UEmpty
      v-else
      icon="i-material-symbols-mosque-rounded"
      title="Belum ada campaign"
      description="Statusnya akan tampil di sini begitu campaign pertama dibuat."
    />

    <template #footer>
      <dl class="space-y-1.5 text-sm">
        <div class="flex items-center justify-between">
          <dt class="text-muted">Total donasi masuk</dt>
          <dd class="numeric font-semibold text-highlighted">
            {{ formatNumber(totalDonation) }}
          </dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-muted">Lembaga mitra</dt>
          <dd class="numeric font-semibold text-highlighted">
            {{ formatNumber(totalFundraiser) }}
          </dd>
        </div>
      </dl>
    </template>
  </UCard>
</template>
