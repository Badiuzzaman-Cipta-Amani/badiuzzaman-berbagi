<script setup lang="ts">
const { media, title } = defineProps<{
  media: Attachment[]
  title: string
}>()

const emit = defineEmits<{
  open: [item: Attachment]
}>()
</script>

<template>
  <UEmpty
    v-if="!media.length"
    icon="i-material-symbols-photo-library-outline-rounded"
    title="Belum ada dokumentasi"
    description="Foto dan video kegiatan akan diunggah seiring program berjalan."
  />

  <ul v-else class="grid grid-cols-2 gap-2.5">
    <li v-for="(item, index) in media" :key="item.url">
      <button
        type="button"
        class="relative block aspect-square w-full overflow-hidden rounded-xl bg-muted transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
        :aria-label="`Perbesar ${item.alt || `dokumentasi ${index + 1}`}`"
        @click="emit('open', item)"
      >
        <NuxtImg
          v-if="item.kind === 'image'"
          :src="item.url"
          :alt="item.alt || title"
          sizes="224px"
          class="h-full w-full object-cover"
          loading="lazy"
        />
        <span
          v-else
          class="flex h-full w-full items-center justify-center bg-primary-950"
        >
          <span
            class="flex size-10 items-center justify-center rounded-full bg-default shadow"
          >
            <UIcon
              name="i-material-symbols-play-arrow-rounded"
              class="size-5 text-primary"
            />
          </span>
        </span>
      </button>
    </li>
  </ul>
</template>
