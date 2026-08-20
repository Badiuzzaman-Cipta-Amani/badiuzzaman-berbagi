<script setup lang="ts">
/**
 * A dashboard figure, tinted by what it means rather than by where it sits in
 * the row. The colours are the ones fixed in `app.config.ts`: emerald is
 * "verified / money in", amber is "waiting on a decision", sky is "in flight",
 * primary navy is the neutral count. A card that turns amber is a card with
 * work behind it — that is the whole point of colouring them.
 */
export type StatTone = "primary" | "success" | "warning" | "info"

const {
  tone = "primary",
  delta = null,
  hint = undefined,
  to = undefined,
} = defineProps<{
  label: string
  value: string
  icon: string
  tone?: StatTone
  hint?: string
  /** Percentage change against the previous period; omitted when there is no basis. */
  delta?: number | null
  /** Makes the whole card a link — used to jump into the queue it counts. */
  to?: string
  loading?: boolean
}>()

const TONES: Record<StatTone, { bar: string; chip: string; icon: string }> = {
  primary: {
    bar: "bg-primary-500",
    chip: "bg-primary-50 text-primary-700",
    icon: "text-primary-700",
  },
  success: {
    bar: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700",
    icon: "text-emerald-700",
  },
  warning: {
    bar: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700",
    icon: "text-amber-700",
  },
  info: {
    bar: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700",
    icon: "text-sky-700",
  },
}

const palette = computed(() => TONES[tone])

const deltaTone = computed(() => {
  if (delta === null || delta === undefined) return null
  if (delta > 0)
    return { color: "text-success", icon: "i-material-symbols-trending-up-rounded" }
  if (delta < 0)
    return { color: "text-error", icon: "i-material-symbols-trending-down-rounded" }
  return { color: "text-muted", icon: "i-material-symbols-trending-flat-rounded" }
})
</script>

<template>
  <UCard :as="to ? 'div' : undefined" class="relative h-full overflow-hidden">
    <!-- The tone reads before the number does, so it lives on the card edge. -->
    <span
      class="absolute inset-y-0 start-0 w-1.5"
      :class="palette.bar"
      aria-hidden="true"
    />

    <div class="flex items-start justify-between gap-4 ps-2.5">
      <div class="min-w-0">
        <p class="text-base font-medium text-muted">{{ label }}</p>

        <USkeleton v-if="loading" class="mt-2.5 h-9 w-32" />
        <p v-else class="mt-1.5 truncate numeric text-3xl font-bold text-highlighted">
          {{ value }}
        </p>
      </div>

      <span
        class="flex size-12 shrink-0 items-center justify-center rounded-xl"
        :class="palette.chip"
      >
        <UIcon :name="icon" class="size-6" />
      </span>
    </div>

    <div
      v-if="!loading && (deltaTone || hint)"
      class="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 ps-2.5"
    >
      <template v-if="deltaTone">
        <UIcon :name="deltaTone.icon" class="size-5" :class="deltaTone.color" />
        <span class="numeric text-base font-semibold" :class="deltaTone.color">
          {{ Math.abs(delta ?? 0).toFixed(0) }}%
        </span>
      </template>
      <span v-if="hint" class="truncate text-sm text-muted">{{ hint }}</span>
    </div>

    <UButton
      v-if="to && !loading"
      :to="to"
      label="Lihat"
      trailing-icon="i-material-symbols-arrow-forward-rounded"
      color="neutral"
      variant="link"
      size="sm"
      class="ms-0 mt-3 ps-2.5"
      :ui="{ base: 'gap-1' }"
    />
  </UCard>
</template>
