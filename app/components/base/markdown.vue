<script setup lang="ts">
/**
 * Renders admin-authored Markdown. The HTML is produced and sanitized by
 * `renderMarkdown`, which allows only the tags the editor's toolbar emits.
 */
const { source } = defineProps<{ source: string | null | undefined }>()

const html = computed(() => renderMarkdown(source))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- sanitized in renderMarkdown() -->
  <div v-if="html" class="markdown" v-html="html" />
</template>
