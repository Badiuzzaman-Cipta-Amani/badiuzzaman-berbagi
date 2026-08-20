<script setup lang="ts">
const { dua, showCampaign = false } = defineProps<{
  dua: DuaItem
  showCampaign?: boolean
}>()

/** Initials keep the avatar personal without inventing a photo for the donor. */
const initials = computed(() =>
  dua.donorName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join(""),
)
</script>

<template>
  <article class="h-full rounded-2xl border border-default p-4">
    <div class="flex items-start gap-3">
      <UAvatar
        :text="initials || '?'"
        size="lg"
        :ui="{ root: 'bg-primary-100 text-primary shrink-0', fallback: 'font-semibold' }"
      />

      <div class="min-w-0 flex-1">
        <div class="flex items-baseline justify-between gap-2">
          <h3 class="truncate text-sm font-semibold text-highlighted">
            {{ dua.donorName }}
          </h3>
          <time class="shrink-0 text-xs text-dimmed" :datetime="dua.createdAt">
            {{ formatRelativeTime(dua.createdAt) }}
          </time>
        </div>

        <UBadge
          v-if="dua.status === 'verified'"
          label="Donatur terverifikasi"
          color="success"
          variant="subtle"
          size="sm"
          class="mt-1.5"
        />

        <p class="mt-2 text-sm leading-relaxed text-toned">
          {{ dua.message }}
        </p>

        <NuxtLink
          v-if="showCampaign && dua.campaign"
          :to="`/donasi/${dua.campaign.slug}`"
          class="mt-3 line-clamp-1 inline-block text-xs font-semibold text-primary hover:underline"
        >
          {{ dua.campaign.title }}
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
