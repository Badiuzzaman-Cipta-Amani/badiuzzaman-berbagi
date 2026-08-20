<script setup lang="ts">
definePageMeta({
  layout: "detail",
})

const reference = ref("")

/**
 * Normalised here rather than at submit: the code is printed in upper case, and
 * a donor retyping it from a WhatsApp message should not be told it is wrong for
 * a lower-case letter or a missing dash.
 */
const normalized = computed(() => {
  const raw = reference.value.trim().toUpperCase().replace(/\s+/g, "")
  return raw.startsWith("BZ-") || !raw ? raw : `BZ-${raw.replace(/^BZ/, "")}`
})

const isValid = computed(() => /^BZ-[0-9A-Z]{6}$/.test(normalized.value))

const submit = () => {
  if (isValid.value) navigateTo(`/lacak-donasi/${normalized.value}`)
}

usePageSeo({
  title: "Lacak Donasi",
  description:
    "Masukkan kode donasi Anda untuk melihat status verifikasi dan mengirim bukti transfer.",
  type: "website",
})
</script>

<template>
  <main class="pb-28">
    <LayoutBackHeader title="Lacak donasi" fallback="/akun" />

    <div class="px-gutter pt-7">
      <span
        class="flex size-14 items-center justify-center rounded-2xl bg-primary-100 text-primary"
      >
        <UIcon name="i-material-symbols-search-rounded" class="size-7" />
      </span>

      <h1 class="mt-5 text-2xl font-bold tracking-tight text-highlighted">
        Cek status donasi Anda
      </h1>
      <p class="mt-2 text-sm leading-relaxed text-muted">
        Masukkan kode donasi yang Anda terima setelah berdonasi. Kode ini berlaku juga
        untuk donasi tanpa akun.
      </p>

      <form class="mt-7 space-y-4" @submit.prevent="submit">
        <UFormField label="Kode donasi" name="reference">
          <UInput
            v-model="reference"
            placeholder="BZ-7K3P9Q"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck="false"
            class="w-full numeric tracking-widest"
            icon="i-material-symbols-confirmation-number-rounded"
          />
          <template #help> Format kode: BZ- diikuti enam huruf atau angka. </template>
        </UFormField>

        <UButton
          type="submit"
          label="Lacak donasi"
          color="primary"
          size="xl"
          block
          :disabled="!isValid"
        />
      </form>

      <div class="mt-8 rounded-2xl border border-default bg-muted p-5">
        <p class="text-sm font-semibold text-highlighted">Kode donasi hilang?</p>
        <p class="mt-1 text-xs leading-relaxed text-muted">
          Donatur yang berdonasi sambil masuk ke akunnya dapat melihat seluruh kodenya di
          riwayat donasi. Bila Anda berdonasi tanpa akun, hubungi tim kami melalui
          WhatsApp dengan menyebutkan nominal dan tanggal transfer.
        </p>
        <UButton
          to="/akun/donasi"
          label="Buka riwayat donasi"
          color="primary"
          variant="subtle"
          size="md"
          class="mt-3"
        />
      </div>
    </div>
  </main>
</template>
