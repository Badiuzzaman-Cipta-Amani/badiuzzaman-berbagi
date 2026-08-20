<script setup lang="ts">
const { fallback = "/donasi" } = defineProps<{
  title: string
  /** Where "back" goes when there is no history to pop. */
  fallback?: string
}>()

const router = useRouter()

/** Deep links and shared URLs have no history to pop, so fall back to a real page. */
const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push(fallback)
}
</script>

<template>
  <header
    class="sticky top-0 z-30 flex items-center gap-2 border-b border-default bg-default/90 px-2 py-2 backdrop-blur-md"
  >
    <UButton
      icon="i-material-symbols-arrow-back-rounded"
      color="neutral"
      variant="ghost"
      aria-label="Kembali"
      @click="goBack"
    />
    <h1 class="truncate text-base font-semibold text-highlighted">
      {{ title }}
    </h1>
    <div class="ms-auto flex items-center gap-1">
      <slot name="actions" />
    </div>
  </header>
</template>
