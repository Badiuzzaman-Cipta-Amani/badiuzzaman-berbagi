<script setup lang="ts">
import { postVerifyAdminDonation } from "~/services/admin/donation"

/**
 * Verifying or rejecting a donation, from either the queue or the detail page.
 * The mutation lives here rather than in each page so the two screens cannot
 * drift on the copy, the note field, or what counts as success — this is the
 * only write that moves `Campaign.raisedAmount`.
 */
const { donation, decision } = defineProps<{
  donation: { id: string; donorName: string; amount: number } | null
  decision: "verified" | "rejected"
}>()

const emit = defineEmits<{ done: [] }>()

const open = defineModel<boolean>("open", { default: false })

const toast = useToast()
const note = ref("")

const { params, body, run } = postVerifyAdminDonation()
const { execute: submit, pending } = run()

watch(open, (isOpen) => {
  if (isOpen) note.value = ""
})

const copy = computed(() =>
  decision === "verified"
    ? {
        title: "Verifikasi donasi ini?",
        description:
          "Nominal donasi akan ditambahkan ke dana terkumpul campaign dan doa donatur akan tampil di halaman publik.",
        confirmLabel: "Verifikasi",
        color: "success" as const,
      }
    : {
        title: "Tolak donasi ini?",
        description:
          "Donasi tidak akan dihitung sebagai dana terkumpul. Jika sebelumnya sudah terverifikasi, nominalnya akan dikurangi kembali.",
        confirmLabel: "Tolak donasi",
        color: "error" as const,
      },
)

const confirm = async () => {
  if (!donation) return

  params.value.id = donation.id
  body.value = { status: decision, reviewNote: note.value }

  try {
    const response = await submit()
    open.value = false
    emit("done")
    toast.add({
      title: response.message,
      icon:
        decision === "verified"
          ? "i-material-symbols-verified-rounded"
          : "i-material-symbols-block-rounded",
      color: decision === "verified" ? "success" : "warning",
    })
  } catch (error) {
    toast.add({
      title: "Gagal memperbarui status",
      description:
        (error as { statusMessage?: string })?.statusMessage ?? "Silakan coba lagi.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="copy.title" :description="copy.description">
    <template #body>
      <div v-if="donation" class="mb-4 rounded-xl bg-muted p-4">
        <p class="text-sm text-muted">{{ donation.donorName }}</p>
        <p class="mt-0.5 numeric text-xl font-bold text-highlighted">
          {{ formatCurrency(donation.amount) }}
        </p>
      </div>

      <UFormField
        name="reviewNote"
        label="Catatan (opsional)"
        help="Tersimpan sebagai jejak keputusan, tidak ditampilkan ke donatur."
      >
        <UTextarea
          v-model="note"
          :rows="3"
          placeholder="Contoh: cocok dengan mutasi 14 Agustus pukul 09.12"
          class="w-full"
        />
      </UFormField>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Batal"
          color="neutral"
          variant="outline"
          size="md"
          :disabled="pending"
          @click="open = false"
        />
        <UButton
          :label="copy.confirmLabel"
          :color="copy.color"
          size="md"
          :loading="pending"
          @click="confirm"
        />
      </div>
    </template>
  </UModal>
</template>
