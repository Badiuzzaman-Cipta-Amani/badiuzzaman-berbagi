<script setup lang="ts">
export type DetailTab = "description" | "documentation" | "updates"

const activeTab = defineModel<DetailTab>("activeTab", { required: true })

/**
 * Doa is deliberately not a tab. It is the page's closing section — a feed the
 * donor scrolls into after reading the program, not a fourth thing to choose
 * between.
 */
const items = [
  { value: "description", label: "Deskripsi" },
  { value: "documentation", label: "Dokumentasi" },
  { value: "updates", label: "Kabar" },
] satisfies { value: DetailTab; label: string }[]
</script>

<template>
  <UTabs
    v-model="activeTab"
    :items="items"
    variant="link"
    color="primary"
    size="md"
    :content="false"
    class="mb-5 w-full"
    :ui="{ list: 'w-full', trigger: 'flex-1' }"
  />
</template>
