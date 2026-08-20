<script setup lang="ts">
const { attachment, title } = defineProps<{
  attachment: Attachment | null
  title: string
}>()
</script>

<template>
  <NuxtImg
    v-if="attachment"
    :src="attachment.url"
    :alt="attachment.alt || title"
    loading="lazy"
    sizes="448px"
    class="h-full w-full object-cover"
  />
  <div v-else class="flex h-full w-full items-center justify-center bg-primary-100">
    <UIcon
      name="i-material-symbols-volunteer-activism-rounded"
      class="size-10 text-primary-300"
    />
  </div>
</template>
