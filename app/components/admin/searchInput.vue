<script setup lang="ts">
/**
 * The search box every admin list uses.
 *
 * One second of quiet before the request goes out — long enough that typing a
 * donor's full name is a single query instead of one per keystroke, and the
 * table below stops flickering through partial matches. The delay is defined
 * here rather than repeated in each page, so "search behaves the same
 * everywhere" is a fact about the component, not a convention to remember.
 */
const ADMIN_SEARCH_DEBOUNCE = 1000

const { modelValue, placeholder = "Cari..." } = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{ "update:modelValue": [value: string] }>()

const draft = ref(modelValue)

// A reset elsewhere on the page (the "Reset filter" button) has to reach the box.
watch(
  () => modelValue,
  (value) => {
    if (value !== draft.value) draft.value = value
  },
)

watchDebounced(
  draft,
  (value) => {
    if (value !== modelValue) emit("update:modelValue", value)
  },
  { debounce: ADMIN_SEARCH_DEBOUNCE },
)

/** True while the typed text has not reached the query yet. */
const settling = computed(() => draft.value !== modelValue)

const clear = () => {
  draft.value = ""
  emit("update:modelValue", "")
}
</script>

<template>
  <UInput
    v-model="draft"
    icon="i-material-symbols-search-rounded"
    :placeholder="placeholder"
    size="md"
    class="w-full"
    :aria-busy="settling"
  >
    <template #trailing>
      <UIcon
        v-if="settling"
        name="i-material-symbols-progress-activity"
        class="size-4 animate-spin text-dimmed"
        aria-hidden="true"
      />
      <UButton
        v-else-if="draft"
        icon="i-material-symbols-close-rounded"
        color="neutral"
        variant="link"
        size="sm"
        aria-label="Hapus pencarian"
        @click="clear"
      />
    </template>
  </UInput>
</template>
