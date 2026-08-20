<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { AdminCampaignUpdateInput } from "~~/shared/validation/admin"

import { adminCampaignUpdateSchema } from "~~/shared/validation/admin"

/**
 * Writing a kabar, on its own page. Create and edit share this component whole,
 * so the screen an admin sees when they publish is the screen they see when they
 * come back to correct it — the modal it replaced could not carry a Markdown
 * editor at a comfortable width anyway.
 */
const props = defineProps<{
  /** Owned by the route, never picked here — writing always starts from a campaign. */
  campaignId: string
  campaignTitle: string
  submitLabel: string
  pending?: boolean
  /** Prefills the fields; the edit page passes the loaded kabar. */
  initial?: AdminCampaignUpdateItem | null
  /** Where "Batal" goes — the campaign's kabar list. */
  cancelTo: string
}>()

const emit = defineEmits<{ submit: [AdminCampaignUpdateBody] }>()

/**
 * `campaignId` sits in the state rather than being spliced on at submit, because
 * `adminCampaignUpdateSchema` is shared with the endpoint and requires it — the
 * form has to validate exactly what will be sent.
 */
const state = reactive<AdminCampaignUpdateInput>({
  campaignId: props.campaignId,
  title: "",
  description: "",
})

watchEffect(() => {
  state.campaignId = props.campaignId

  if (!props.initial) return
  state.title = props.initial.title
  state.description = props.initial.description
})

const onSubmit = (event: FormSubmitEvent<AdminCampaignUpdateInput>) => {
  emit("submit", event.data)
}
</script>

<template>
  <!-- The negative bottom margin docks `<AdminFormActions>`; see that component. -->
  <UForm
    id="admin-update-form"
    :schema="adminCampaignUpdateSchema"
    :state="state"
    class="-mb-5 sm:-mb-7"
    @submit="onSubmit"
  >
    <UCard>
      <template #header>
        <div>
          <h3 class="text-lg font-semibold text-highlighted">Isi kabar</h3>
          <p class="mt-1 text-sm text-muted">
            Untuk campaign
            <span class="font-medium text-toned">{{ campaignTitle }}</span
            >. Kabar langsung tampil pada tab Kabar di halaman publik.
          </p>
        </div>
      </template>

      <div class="space-y-6">
        <UFormField name="title" label="Judul" required>
          <UInput
            v-model="state.title"
            placeholder="Pengeboran tahap pertama dimulai"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="description"
          label="Isi kabar"
          required
          help="Ditulis dan disimpan sebagai Markdown, lalu ditampilkan apa adanya di halaman detail campaign."
        >
          <AdminMarkdownEditor
            v-model="state.description"
            placeholder="Ceritakan perkembangan terbaru beserta dampaknya bagi penerima manfaat."
          />
        </UFormField>
      </div>
    </UCard>

    <AdminFormActions hint="Kabar langsung tampil di halaman publik setelah disimpan.">
      <UButton
        :to="cancelTo"
        label="Batal"
        color="neutral"
        variant="outline"
        size="lg"
        class="justify-center"
        :disabled="pending"
      />
      <UButton
        type="submit"
        form="admin-update-form"
        :label="submitLabel"
        icon="i-material-symbols-save-rounded"
        color="primary"
        size="xl"
        class="justify-center"
        :loading="pending"
        :loading-auto="false"
      />
    </AdminFormActions>
  </UForm>
</template>
