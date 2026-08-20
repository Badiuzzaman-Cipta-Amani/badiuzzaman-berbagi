<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { ConfirmDonationInput } from "~~/shared/validation/donation"

import { site } from "~/constants/site"
import { getTrackDonation, postConfirmDonation } from "~/services/donation"

definePageMeta({
  layout: "detail",
})

const route = useRoute()
const toast = useToast()

const reference = computed(() => String(route.params.reference ?? "").toUpperCase())

const { params, run } = getTrackDonation({ params: { reference: reference.value } })
const { data, status, error, refresh } = run()

watch(reference, (value) => (params.value.reference = value))

const donation = computed(() => data.value?.data ?? null)
const loading = computed(() => status.value === "pending")

/* Confirming the transfer -------------------------------------------------- */

const {
  params: confirmParams,
  body,
  validation,
  run: runConfirm,
} = postConfirmDonation({ params: { reference: reference.value } })
const { execute: confirm, pending: confirming } = runConfirm()

watch(reference, (value) => (confirmParams.value.reference = value))

const state = reactive({ proofUrl: "", proofNote: "" })

const onConfirm = async (event: FormSubmitEvent<ConfirmDonationInput>) => {
  body.value = event.data

  try {
    const response = await confirm()
    await refresh()
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch (err) {
    toast.add({
      title: "Konfirmasi gagal dikirim",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Silakan coba lagi.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

const whatsappLink = computed(() => {
  const receipt = donation.value
  if (!receipt) return site.whatsapp.href

  const text = `Halo, saya (${receipt.donorName}) ingin mengonfirmasi donasi dengan kode ${receipt.reference} sebesar ${formatCurrency(receipt.amount)}.`
  return `${site.whatsapp.href}?text=${encodeURIComponent(text)}`
})

usePageSeo({
  title: `Donasi ${reference.value}`,
  description: "Status verifikasi donasi Anda di Badiuzzaman Berbagi.",
  type: "website",
})

// A page addressed by a private code has no business in a search index.
useSeoMeta({ robots: "noindex, nofollow" })
</script>

<template>
  <main class="pb-28">
    <LayoutBackHeader title="Status donasi" fallback="/lacak-donasi" />

    <div class="px-gutter pt-6">
      <div v-if="loading" class="space-y-4">
        <USkeleton class="h-64 w-full rounded-2xl" />
        <USkeleton class="h-40 w-full rounded-2xl" />
      </div>

      <UEmpty
        v-else-if="error || !donation"
        icon="i-material-symbols-search-off-rounded"
        title="Donasi tidak ditemukan"
        description="Periksa kembali kode donasi Anda. Kode terdiri dari BZ- diikuti enam karakter."
        :actions="[
          { label: 'Coba kode lain', color: 'primary', to: '/lacak-donasi' },
          {
            label: 'Hubungi kami',
            color: 'neutral',
            variant: 'ghost',
            to: site.whatsapp.href,
            target: '_blank',
          },
        ]"
        class="mt-10"
      />

      <template v-else>
        <DonationReceiptCard :donation="donation" />

        <!--
          The donor's half of verification. It records proof and nothing else —
          the status stays `pending` until an admin matches the bank statement,
          so this form never claims the donation is done.
        -->
        <section
          v-if="donation.status === 'pending' && !donation.confirmedAt"
          class="mt-6"
          aria-labelledby="konfirmasi-heading"
        >
          <h2 id="konfirmasi-heading" class="text-lg font-bold text-highlighted">
            Kirim bukti transfer
          </h2>
          <p class="mt-1 text-sm leading-relaxed text-muted">
            Unggah bukti transfer Anda ke layanan berbagi gambar, lalu tempelkan tautannya
            di sini. Tim kami mencocokkannya dengan mutasi rekening sebelum memverifikasi.
          </p>

          <UForm
            :schema="validation"
            :state="state"
            class="mt-4 space-y-4"
            @submit="onConfirm"
          >
            <UFormField name="proofUrl" label="Tautan bukti transfer" required>
              <UInput
                v-model="state.proofUrl"
                type="url"
                inputmode="url"
                placeholder="https://..."
                class="w-full"
              />
            </UFormField>

            <UFormField name="proofNote" label="Catatan" hint="Opsional">
              <UTextarea
                v-model="state.proofNote"
                :rows="3"
                :maxlength="300"
                placeholder="Contoh: transfer dari BCA a.n. Ahmad, 18 Agustus pukul 14.10."
                class="w-full"
                :ui="{ base: 'resize-none' }"
              />
            </UFormField>

            <UButton
              type="submit"
              label="Kirim konfirmasi"
              icon="i-material-symbols-send-rounded"
              color="primary"
              size="xl"
              block
              :loading="confirming"
              :loading-auto="false"
            />
          </UForm>
        </section>

        <section
          v-else-if="donation.confirmedAt"
          class="mt-6 rounded-2xl border border-default p-5"
          aria-labelledby="bukti-heading"
        >
          <h2 id="bukti-heading" class="text-lg font-bold text-highlighted">
            Bukti yang Anda kirim
          </h2>
          <p class="mt-1 text-sm text-muted">
            Dikirim {{ formatRelativeTime(donation.confirmedAt) }}.
          </p>

          <UButton
            v-if="donation.proofUrl"
            :to="donation.proofUrl"
            target="_blank"
            rel="noopener noreferrer"
            label="Lihat bukti transfer"
            icon="i-material-symbols-image-rounded"
            trailing-icon="i-material-symbols-open-in-new-rounded"
            color="neutral"
            variant="subtle"
            block
            class="mt-3 justify-between"
          />

          <p v-if="donation.proofNote" class="mt-3 text-sm leading-relaxed text-toned">
            {{ donation.proofNote }}
          </p>
        </section>

        <UButton
          :to="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          label="Hubungi tim via WhatsApp"
          icon="i-simple-icons-whatsapp"
          color="success"
          variant="subtle"
          size="lg"
          block
          class="mt-6"
        />
      </template>
    </div>
  </main>
</template>
