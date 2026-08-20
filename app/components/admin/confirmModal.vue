<script setup lang="ts">
defineProps<{
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  /** Destructive by default — every current caller is a delete. */
  color?: "error" | "primary"
}>()

const open = defineModel<boolean>("open", { default: false })

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Batal"
          color="neutral"
          variant="outline"
          size="md"
          :disabled="loading"
          @click="open = false"
        />
        <UButton
          :label="confirmLabel ?? 'Hapus'"
          :color="color ?? 'error'"
          size="md"
          :loading="loading"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
