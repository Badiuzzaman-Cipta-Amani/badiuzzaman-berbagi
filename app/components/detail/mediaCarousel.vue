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
  <div v-if="!media.length" class="flex h-64 items-center justify-center bg-primary-100">
    <UIcon
      name="i-material-symbols-volunteer-activism-rounded"
      class="size-12 text-primary-300"
    />
  </div>

  <!--
    UCarousel brings the keyboard handling, slide roles, and dot tablist that the
    previous scroll-listener version had no way to provide.
  -->
  <UCarousel
    v-else
    v-slot="{ item, index }"
    :items="media"
    :dots="media.length > 1"
    :arrows="media.length > 1"
    class="w-full"
    :ui="{
      item: 'basis-full min-w-0',
      controls: 'absolute inset-x-0 bottom-0 top-0 pointer-events-none',
      arrows: 'pointer-events-auto',
      /*
        The theme's horizontal variant parks the arrows outside the frame from
        `sm` up (`sm:-start-12` / `sm:-end-12`). Inside the max-w-md phone shell
        that puts them off the card, so both breakpoints are pinned inward.
      */
      prev: 'start-2 sm:start-2 -translate-y-1/2 top-1/2',
      next: 'end-2 sm:end-2 -translate-y-1/2 top-1/2',
      dots: 'pointer-events-auto absolute inset-x-0 bottom-3 justify-center',
      dot: 'w-2 h-2 data-[state=active]:w-6 bg-white/50 data-[state=active]:bg-white transition-all',
    }"
  >
    <button
      type="button"
      class="relative block h-64 w-full bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      :aria-label="`Perbesar media ${index + 1} dari ${media.length}`"
      @click="emit('open', item)"
    >
      <NuxtImg
        v-if="item.kind === 'image'"
        :src="item.url"
        :alt="item.alt || title"
        sizes="448px"
        class="h-full w-full object-cover"
        :loading="index === 0 ? 'eager' : 'lazy'"
      />
      <span v-else class="flex h-full w-full items-center justify-center bg-primary-950">
        <span
          class="flex size-14 items-center justify-center rounded-full bg-default shadow-lg"
        >
          <UIcon
            name="i-material-symbols-play-arrow-rounded"
            class="size-7 text-primary"
          />
        </span>
      </span>
    </button>
  </UCarousel>
</template>
