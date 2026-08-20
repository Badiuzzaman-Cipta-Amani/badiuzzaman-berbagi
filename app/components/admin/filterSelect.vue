<script setup lang="ts">
/**
 * The single-choice filter every admin list uses.
 *
 * It exists because of one sharp edge: `USelectMenu` cannot tell an item whose
 * value is the empty string apart from "nothing selected", so the neutral
 * option — "Semua status", "Semua kategori", "Semua peran" — could be clicked
 * but never took. Swapping in a sentinel keeps every option a real value; the
 * empty string only exists on the query object the API sees.
 *
 * It also drops the search box below a handful of options, where a filter field
 * over four items is noise rather than help.
 */
const ALL = "__all__"

const {
  modelValue,
  items,
  icon = undefined,
  placeholder = undefined,
  searchThreshold = 8,
} = defineProps<{
  modelValue: string
  items: { label: string; value: string; description?: string }[]
  icon?: string
  placeholder?: string
  /** Show the search field once the list is at least this long. */
  searchThreshold?: number
}>()

const emit = defineEmits<{ "update:modelValue": [value: string] }>()

const options = computed(() =>
  items.map((item) => ({ ...item, value: item.value === "" ? ALL : item.value })),
)

const selected = computed({
  get: () => modelValue || ALL,
  set: (value: string) => emit("update:modelValue", value === ALL ? "" : value),
})
</script>

<template>
  <USelectMenu
    v-model="selected"
    :items="options"
    value-key="value"
    :icon="icon"
    :placeholder="placeholder"
    :search-input="items.length >= searchThreshold"
    size="md"
    class="w-full"
  />
</template>
