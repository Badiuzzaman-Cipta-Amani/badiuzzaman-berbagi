<script setup lang="ts">
import { activeSocials, site } from "~/constants/site"
</script>

<template>
  <section class="px-gutter pt-7">
    <div class="overflow-hidden rounded-2xl bg-primary-900">
      <div class="p-7 text-center">
        <span
          class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-100/10 ring-1 ring-primary-100/15"
        >
          <UIcon name="i-material-symbols-mosque-rounded" class="size-7 text-white" />
        </span>

        <h2 class="mt-5 text-xl leading-tight font-bold text-balance text-white">
          {{ site.foundation }}
        </h2>
        <p class="mt-2 text-sm text-primary-200">
          Menyalurkan donasi sejak
          <span class="numeric">{{ site.foundedYear }}</span>
        </p>
        <p class="mx-auto mt-4 max-w-[34ch] text-sm leading-relaxed text-primary-200">
          Menyalurkan kebaikan Anda dengan transparan dan amanah kepada mereka yang
          membutuhkan.
        </p>

        <div
          v-if="activeSocials.length"
          class="mt-6 flex items-center justify-center gap-2"
        >
          <UButton
            v-for="social in activeSocials"
            :key="social.label"
            :to="social.href"
            :icon="social.icon"
            :aria-label="social.label"
            target="_blank"
            rel="noopener noreferrer"
            color="neutral"
            variant="ghost"
            :ui="{ base: 'text-white hover:bg-white/10' }"
          />
        </div>
      </div>

      <div class="border-t border-white/10 p-5">
        <div class="h-44 overflow-hidden rounded-xl ring-1 ring-white/10">
          <iframe
            :src="site.mapsEmbed"
            title="Lokasi kantor yayasan"
            width="100%"
            height="100%"
            style="border: 0"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          />
        </div>
        <p class="mt-3 flex items-start gap-2 text-sm text-primary-200">
          <UIcon
            name="i-material-symbols-location-on-rounded"
            class="mt-0.5 size-4 shrink-0"
          />
          {{ site.address }}
        </p>
      </div>
    </div>
  </section>
</template>
