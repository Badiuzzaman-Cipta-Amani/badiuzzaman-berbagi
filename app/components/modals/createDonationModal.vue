<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { CampaignRequestInput } from "~~/shared/validation/campaignRequest"

import {
  MIN_CAMPAIGN_TARGET,
  campaignRequestSchema,
} from "~~/shared/validation/campaignRequest"

import { categories } from "~/constants/category"

const emit = defineEmits<{
  submit: [form: CampaignRequestInput]
}>()

const open = defineModel<boolean>("open", { default: false })

const empty = (): CampaignRequestInput => ({
  title: "",
  category: "",
  target: MIN_CAMPAIGN_TARGET,
  story: "",
  beneficiary: "",
  whatsapp: "",
})

const state = reactive<CampaignRequestInput>(empty())

// `value` is widened to `string` so it matches the schema's `category: string`.
const categoryItems = categories.map((category) => ({
  label: category.name,
  value: category.key as string,
  icon: category.icon,
}))

const onSubmit = (event: FormSubmitEvent<CampaignRequestInput>) => {
  emit("submit", event.data)
  open.value = false
}

watch(open, (isOpen) => {
  if (!isOpen) Object.assign(state, empty())
})
</script>

<template>
  <!--
    The form is long enough to scroll, so the submit is lifted out of the flow
    and pinned: `body` owns the scroll region and `footer` sticks to the bottom
    edge above it, with a border and a blur so it reads as floating over the
    content rather than as the last field in it.
  -->
  <UDrawer
    v-model:open="open"
    title="Galang donasi"
    description="Ajukan program bantuan untuk mereka yang membutuhkan."
    :ui="{
      container: 'max-w-md mx-auto',
      content: 'max-h-[92dvh]',
      body: 'overflow-y-auto',
      footer:
        'sticky bottom-0 z-10 border-t border-default bg-default/95 pb-bar backdrop-blur-md',
    }"
  >
    <template #body>
      <UForm
        id="campaign-request-form"
        :schema="campaignRequestSchema"
        :state="state"
        class="space-y-5 pb-2"
        @submit="onSubmit"
      >
        <UFormField name="title" label="Judul program" required>
          <UInput
            v-model="state.title"
            placeholder="Contoh: Bantu renovasi mushola"
            class="w-full"
          />
        </UFormField>

        <UFormField name="category" label="Kategori" required>
          <USelect
            v-model="state.category"
            :items="categoryItems"
            placeholder="Pilih kategori"
            class="w-full"
          />
        </UFormField>

        <UFormField name="target" label="Target donasi" required>
          <!--
            The locale is pinned because `IDR` renders as the ISO code "IDR" in
            every locale but Indonesian — only `id-ID` prints the "Rp" symbol
            donors actually read, and it groups with the dots they expect.
          -->
          <UInputNumber
            v-model="state.target"
            locale="id-ID"
            :min="0"
            :step="1_000_000"
            :format-options="{
              style: 'currency',
              currency: 'IDR',
              currencyDisplay: 'symbol',
              maximumFractionDigits: 0,
            }"
            class="w-full"
          />
        </UFormField>

        <UFormField name="story" label="Cerita dan keterangan" required>
          <UTextarea
            v-model="state.story"
            :rows="4"
            placeholder="Ceritakan kondisi, kebutuhan, dan rencana penyaluran dana..."
            class="w-full"
            :ui="{ base: 'resize-none' }"
          />
        </UFormField>

        <UFormField name="beneficiary" label="Nama penerima manfaat" required>
          <UInput
            v-model="state.beneficiary"
            placeholder="Nama orang atau lembaga penerima"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="whatsapp"
          label="Nomor WhatsApp"
          help="Tim kami menghubungi nomor ini untuk verifikasi."
          required
        >
          <UInput
            v-model="state.whatsapp"
            type="tel"
            inputmode="tel"
            placeholder="0812xxxxxxxx"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton
        type="submit"
        form="campaign-request-form"
        label="Kirim pengajuan"
        color="primary"
        size="xl"
        block
      />
    </template>
  </UDrawer>
</template>
