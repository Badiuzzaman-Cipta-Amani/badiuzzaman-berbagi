<script setup lang="ts">
/**
 * Verified donations per day. `nuxt-charts` (Unovis) replaces the hand-drawn SVG
 * this used to be: the crosshair, the tooltip, and the axis ticks are the parts
 * that were missing, and they are exactly what makes a trend readable.
 *
 * The chart is client-only — the module registers these components with
 * `mode: "client"` — which is a non-issue on an `ssr: false` app.
 */
const props = defineProps<{
  points: AdminDashboardTrendPoint[]
  loading?: boolean
}>()

const series = computed(() =>
  props.points.map((point) => ({
    date: point.date,
    amount: point.amount,
    count: point.count,
  })),
)

const categories = {
  amount: { name: "Dana terverifikasi", color: "var(--color-primary-500)" },
}

/** Unovis hands the x formatter an index, not the datum. */
const xFormatter = (index: number) => formatDateShort(props.points[index]?.date)
const yFormatter = (value: number) => formatCurrencyShort(value)

const total = computed(() => props.points.reduce((sum, point) => sum + point.amount, 0))
const count = computed(() => props.points.reduce((sum, point) => sum + point.count, 0))

const busiest = computed(() =>
  props.points.reduce<AdminDashboardTrendPoint | null>(
    (best, point) => (!best || point.amount > best.amount ? point : best),
    null,
  ),
)

const hasVolume = computed(() => total.value > 0)
</script>

<template>
  <UCard class="h-full">
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 class="text-base font-semibold text-highlighted">
            Tren donasi terverifikasi
          </h3>
          <p class="mt-0.5 text-sm text-muted">
            {{ points.length }} hari terakhir ·
            <span class="numeric font-semibold text-toned">
              {{ formatCurrency(total) }}
            </span>
            dari
            <span class="numeric font-semibold text-toned">{{
              formatNumber(count)
            }}</span>
            donasi
          </p>
        </div>

        <UBadge
          v-if="busiest && busiest.amount > 0"
          :label="`Tertinggi ${formatDateShort(busiest.date)} · ${formatCurrencyShort(busiest.amount)}`"
          color="primary"
          variant="subtle"
        />
      </div>
    </template>

    <USkeleton v-if="loading" class="h-64 w-full rounded-lg" />

    <UEmpty
      v-else-if="!hasVolume"
      icon="i-material-symbols-show-chart-rounded"
      title="Belum ada donasi terverifikasi"
      description="Grafik akan terisi begitu donasi pada rentang ini diverifikasi."
    />

    <AreaChart
      v-else
      :data="series"
      :height="256"
      :categories="categories"
      :curve-type="CurveType.MonotoneX"
      :x-formatter="xFormatter"
      :y-formatter="yFormatter"
      :y-num-ticks="4"
      :x-num-ticks="5"
      hide-legend
      y-grid-line
    />
  </UCard>
</template>
