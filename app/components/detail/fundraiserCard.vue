<script setup lang="ts">
import { mapsEmbedUrl } from "~/utils/maps"

const { campaign } = defineProps<{
  campaign: CampaignDetail
}>()

/** Prefer the fundraiser's pin, fall back to the campaign's own location pin. */
const mapsUrl = computed(() => campaign.fundraiser?.googleMaps || campaign.mapsUrl)

/**
 * The stored value is a share link, which Google refuses to frame. `mapsEmbedUrl`
 * recovers the pin from it — falling back to the campaign's written location —
 * and returns `null` when there is nothing to point at, so the card degrades to
 * the plain link rather than framing an error page.
 */
const embedUrl = computed(() => mapsEmbedUrl(mapsUrl.value, campaign.location))
</script>

<template>
  <section
    class="overflow-hidden rounded-2xl border border-default"
    aria-labelledby="fundraiser-heading"
  >
    <div class="p-5">
      <h2
        id="fundraiser-heading"
        class="text-xs font-semibold tracking-wide text-muted uppercase"
      >
        Penggalang dana
      </h2>

      <div class="mt-3 flex items-center gap-3">
        <UAvatar
          icon="i-material-symbols-mosque-rounded"
          size="xl"
          :ui="{ root: 'bg-primary-100 text-primary shrink-0 rounded-xl' }"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-highlighted">
            {{ campaign.fundraiser?.name ?? "Badiuzzaman Berbagi" }}
          </p>
          <UBadge
            :label="campaign.verifiedAt ? 'Terverifikasi' : 'Menunggu verifikasi'"
            :color="campaign.verifiedAt ? 'success' : 'neutral'"
            :icon="
              campaign.verifiedAt
                ? 'i-material-symbols-verified-rounded'
                : 'i-material-symbols-schedule-rounded'
            "
            variant="subtle"
            size="sm"
            class="mt-1"
          />
        </div>
      </div>

      <p
        v-if="campaign.fundraiser?.description"
        class="mt-4 text-sm leading-relaxed text-toned"
      >
        {{ campaign.fundraiser.description }}
      </p>

      <dl class="mt-5 grid grid-cols-2 gap-4 border-t border-default pt-4 text-sm">
        <div>
          <dt class="text-xs text-muted">Lokasi</dt>
          <dd class="mt-1 font-medium text-toned">{{ campaign.location ?? "—" }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted">Donatur</dt>
          <dd class="mt-1 numeric font-medium text-toned">
            {{ formatNumber(campaign.totalDonor) }} orang
          </dd>
        </div>
      </dl>
    </div>

    <!--
      The embedded map is the whole answer to "where is this": it is pannable and
      zoomable in place. The "Buka di Google Maps" button under it was a second
      route to the same pin that only ever sent the donor out of the page.
    -->
    <div v-if="embedUrl" class="border-t border-default">
      <iframe
        :src="embedUrl"
        :title="`Peta lokasi ${campaign.fundraiser?.name ?? campaign.title}`"
        class="block h-52 w-full border-0"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      />
    </div>
  </section>
</template>
