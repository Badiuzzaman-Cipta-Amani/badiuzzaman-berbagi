<script setup lang="ts">
const { media } = defineProps<{
  media: Attachment | null
}>()

const open = defineModel<boolean>("open", { default: false })
</script>

<template>
  <UModal
    v-model:open="open"
    fullscreen
    :title="media?.alt || media?.name || 'Pratinjau media'"
    :ui="{
      content: 'bg-primary-950/95 ring-0 divide-y-0',
      header: 'sr-only',
      body: 'flex items-center justify-center p-4 sm:p-8',
    }"
  >
    <template #body>
      <UButton
        icon="i-material-symbols-close-rounded"
        color="neutral"
        variant="ghost"
        size="xl"
        aria-label="Tutup pratinjau"
        class="absolute top-3 right-3 z-10 text-white hover:bg-white/10"
        @click="open = false"
      />

      <NuxtImg
        v-if="media?.kind === 'image'"
        :src="media.url"
        :alt="media.alt || media.name"
        class="max-h-full max-w-full rounded-lg object-contain"
      />
      <video
        v-else-if="media"
        :src="media.url"
        controls
        autoplay
        class="max-h-full max-w-full rounded-lg"
      />
    </template>
  </UModal>
</template>
