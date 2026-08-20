<script setup lang="ts">
import type { SiteMedia } from "~/constants/site"

import { documentation } from "~/constants/site"

/**
 * Photos and videos of the foundation's work. Tiles open the same lightbox the
 * campaign detail page uses, so image and video playback behave identically
 * across the app.
 */
const active = ref<Attachment | null>(null)
const showLightbox = ref(false)

/** The lightbox speaks `Attachment`; the site constant is a lighter shape. */
const toAttachment = (media: SiteMedia): Attachment => ({
  name: media.caption,
  path: media.url,
  mime: media.kind === "video" ? "video/mp4" : "image/jpeg",
  alt: media.caption,
  kind: media.kind,
  url: media.url,
})

const open = (media: SiteMedia) => {
  active.value = toAttachment(media)
  showLightbox.value = true
}
</script>

<template>
  <section v-if="documentation.length">
    <h2 class="text-lg font-bold tracking-tight text-highlighted">Dokumentasi</h2>
    <p class="mt-2 text-sm leading-relaxed text-muted">
      Foto dan video kegiatan penyaluran. Ketuk untuk memperbesar.
    </p>

    <ul class="mt-4 grid grid-cols-2 gap-2.5">
      <li v-for="media in documentation" :key="media.url">
        <UButton
          color="neutral"
          variant="ghost"
          :aria-label="`Buka ${media.caption}`"
          class="relative block aspect-square w-full overflow-hidden rounded-xl bg-muted p-0 active:scale-[0.98]"
          @click="open(media)"
        >
          <NuxtImg
            :src="media.poster ?? media.url"
            :alt="media.caption"
            sizes="224px"
            class="h-full w-full object-cover"
            loading="lazy"
          />

          <span
            v-if="media.kind === 'video'"
            class="absolute inset-0 flex items-center justify-center bg-primary-950/25"
          >
            <span
              class="flex size-11 items-center justify-center rounded-full bg-default shadow"
            >
              <UIcon
                name="i-material-symbols-play-arrow-rounded"
                class="size-6 text-primary"
              />
            </span>
          </span>

          <span
            class="absolute inset-x-0 bottom-0 bg-linear-to-t from-primary-950/80 to-transparent px-3 pt-6 pb-2 text-start text-xs font-medium text-white"
          >
            {{ media.caption }}
          </span>
        </UButton>
      </li>
    </ul>

    <p class="mt-3 text-xs leading-relaxed text-dimmed">
      Materi contoh. Foto dan video kegiatan yang sebenarnya akan menggantikan tampilan
      ini.
    </p>

    <ModalsMediaLightboxModal v-model:open="showLightbox" :media="active" />
  </section>
</template>
