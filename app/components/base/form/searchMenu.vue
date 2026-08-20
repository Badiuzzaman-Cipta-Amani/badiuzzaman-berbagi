<script setup lang="ts">
export type SearchMenuItem = { label: string; value: string }

const {
  items,
  loading = false,
  variant = "none",
  placeholder = "Cari...",
  debounce = 400,
} = defineProps<{
  items: SearchMenuItem[]
  loading?: boolean
  variant?: "outline" | "soft" | "subtle" | "ghost" | "none"
  placeholder?: string
  debounce?: number
}>()

const emit = defineEmits<{
  select: [item: SearchMenuItem]
}>()

/**
 * `model` is the committed search term the caller queries with; `term` is what
 * the user is currently typing. Debouncing between them keeps us off the
 * network until the typing settles.
 */
const model = defineModel<string>({ default: "" })
const term = ref(model.value)
const selected = ref<SearchMenuItem | undefined>()

watchDebounced(term, (value) => (model.value = value), { debounce })

watch(model, (value) => {
  if (value !== term.value) term.value = value
})

watch(selected, (item) => {
  if (item) emit("select", item)
})
</script>

<template>
  <UInputMenu
    v-model="selected"
    v-model:search-term="term"
    ignore-filter
    :items="items"
    :loading="loading"
    :variant="variant"
    :placeholder="placeholder"
    icon="i-material-symbols-search-rounded"
    class="w-full"
    :ui="{ base: 'rounded-xl' }"
  >
    <template #empty>
      <p class="px-2 py-3 text-sm text-muted">Tidak ada kampanye yang cocok.</p>
    </template>
  </UInputMenu>
</template>
