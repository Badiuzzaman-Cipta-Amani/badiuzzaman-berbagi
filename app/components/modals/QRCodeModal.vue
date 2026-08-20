<script setup lang="ts">
import { site } from "~/constants/site"

/**
 * What a donor sees the moment their donation is recorded. It is not a payment
 * screen — there is no gateway — so it hands over the two things that actually
 * move the donation forward: the reference, and the way to send proof.
 */
const { donation, campaignTitle } = defineProps<{
  donation: DonationReceipt
  campaignTitle: string
}>()

const open = defineModel<boolean>("open", { default: false })

const whatsappLink = computed(() => {
  const text = `Halo, saya (${donation.donorName}) telah berdonasi untuk program "${campaignTitle}" sebesar ${formatCurrency(donation.amount)}. Kode donasi: ${donation.reference}. Mohon konfirmasinya.`
  return `${site.whatsapp.href}?text=${encodeURIComponent(text)}`
})

const copied = ref(false)

const copyReference = async () => {
  try {
    await navigator.clipboard.writeText(donation.reference)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // Clipboard access can be refused; the code is on screen either way.
    copied.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Donasi tercatat"
    description="Simpan kode donasi Anda, lalu selesaikan pembayarannya."
    :ui="{ content: 'max-w-sm' }"
  >
    <template #body>
      <div class="space-y-5">
        <!--
          The reference replaces the QR placeholder that used to sit here. It is
          a real, usable thing rather than a picture of one: it is what the donor
          quotes to look the donation up and to send proof.
        -->
        <div
          class="flex flex-col items-center rounded-xl border border-dashed border-primary-200 bg-primary-50 p-6 text-center"
        >
          <p class="text-xs font-semibold tracking-wide text-primary-700 uppercase">
            Kode donasi Anda
          </p>
          <p class="mt-1.5 numeric text-2xl font-bold tracking-widest text-primary-800">
            {{ donation.reference }}
          </p>
          <UButton
            :label="copied ? 'Kode disalin' : 'Salin kode'"
            :icon="
              copied
                ? 'i-material-symbols-check-rounded'
                : 'i-material-symbols-content-copy-rounded'
            "
            color="primary"
            variant="ghost"
            size="sm"
            class="mt-2"
            @click="copyReference"
          />
        </div>

        <dl class="divide-y divide-default rounded-xl border border-default text-sm">
          <div class="flex items-center justify-between gap-4 px-4 py-3">
            <dt class="text-muted">Nominal</dt>
            <dd class="numeric font-bold text-highlighted">
              {{ formatCurrency(donation.amount) }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 px-4 py-3">
            <dt class="text-muted">Atas nama</dt>
            <dd class="truncate font-medium text-toned">{{ donation.donorName }}</dd>
          </div>
          <div class="flex items-center justify-between gap-4 px-4 py-3">
            <dt class="text-muted">Status</dt>
            <dd>
              <UBadge
                label="Menunggu verifikasi"
                color="warning"
                variant="subtle"
                size="sm"
                icon="i-material-symbols-schedule-rounded"
              />
            </dd>
          </div>
        </dl>

        <p class="text-xs leading-relaxed text-muted">
          Donasi diverifikasi secara manual oleh tim kami setelah bukti transfer diterima.
          Kirim bukti melalui halaman lacak donasi atau WhatsApp.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="w-full space-y-2">
        <UButton
          :to="`/lacak-donasi/${donation.reference}`"
          label="Kirim bukti transfer"
          icon="i-material-symbols-upload-rounded"
          color="primary"
          size="xl"
          block
          @click="open = false"
        />
        <UButton
          :to="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          label="Konfirmasi via WhatsApp"
          icon="i-simple-icons-whatsapp"
          color="success"
          variant="subtle"
          size="lg"
          block
        />
        <UButton
          label="Tutup"
          color="neutral"
          variant="ghost"
          block
          @click="open = false"
        />
      </div>
    </template>
  </UModal>
</template>
