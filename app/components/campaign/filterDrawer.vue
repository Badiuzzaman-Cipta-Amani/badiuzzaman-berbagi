<script setup lang="ts">
/**
 * A single-choice bottom sheet whose selection is *staged*. Tapping an option
 * only moves a local draft; the list behind the sheet does not refetch until
 * "Terapkan" is pressed. Dismissing the sheet — by the close button, the
 * backdrop, or Escape — throws the draft away and leaves the list as it was.
 */
const { modelValue, neutralValue = "" } = defineProps<{
  title: string
  description: string
  items: { label: string; value: string }[]
  modelValue: string
  /** Which value counts as "no filter", so the reset button knows where to land. */
  neutralValue?: string
}>()

const emit = defineEmits<{ apply: [value: string] }>()

const open = defineModel<boolean>("open", { default: false })

const draft = ref(modelValue)

// Every opening starts from what is actually applied, not from the draft the
// user walked away from last time.
watch(open, (isOpen) => {
  if (isOpen) draft.value = modelValue
})

const dirty = computed(() => draft.value !== modelValue)
const canReset = computed(() => draft.value !== neutralValue)

const apply = () => {
  emit("apply", draft.value)
  open.value = false
}
</script>

<template>
  <UDrawer
    v-model:open="open"
    :title="title"
    :description="description"
    :ui="{ container: 'max-w-md mx-auto', content: 'max-h-[85dvh]' }"
  >
    <template #body>
      <URadioGroup
        v-model="draft"
        :items="items"
        variant="list"
        color="primary"
        class="overflow-y-auto"
      />
    </template>

    <template #footer>
      <div class="flex w-full gap-2">
        <UButton
          label="Reset"
          color="neutral"
          variant="outline"
          size="xl"
          class="flex-1"
          block
          :disabled="!canReset"
          @click="draft = neutralValue"
        />
        <UButton
          :label="dirty ? 'Terapkan' : 'Tutup'"
          color="primary"
          size="xl"
          class="flex-1"
          block
          @click="apply"
        />
      </div>
    </template>
  </UDrawer>
</template>
