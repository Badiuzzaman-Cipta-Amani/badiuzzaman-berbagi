<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { ForgotPasswordInput } from "~~/shared/validation/auth"

import { postForgotPassword } from "~/services/auth"

definePageMeta({
  layout: "auth",
  middleware: "auth-guest",
})

const toast = useToast()

const { body, validation, run } = postForgotPassword()
const { execute: request, pending } = run()

const state = reactive({ email: "" })

/** What the endpoint answered: the message always, the link only until a mailer exists. */
const sent = ref(false)
const resetUrl = ref<string | null>(null)

const onSubmit = async (event: FormSubmitEvent<ForgotPasswordInput>) => {
  body.value = event.data

  try {
    const response = await request()
    sent.value = true
    resetUrl.value = response.data.resetUrl
  } catch (error) {
    toast.add({
      title: "Gagal memproses permintaan",
      description:
        (error as { statusMessage?: string })?.statusMessage ??
        "Periksa koneksi Anda, lalu coba lagi.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

usePageSeo({
  title: "Lupa Kata Sandi",
  description: "Atur ulang kata sandi akun Badiuzzaman Berbagi Anda.",
  type: "website",
})
</script>

<template>
  <div class="flex min-h-screen flex-col px-6 pt-4 pb-10">
    <UButton
      icon="i-material-symbols-arrow-back-rounded"
      color="neutral"
      variant="ghost"
      aria-label="Kembali"
      class="-ms-2 self-start text-white hover:bg-white/10"
      @click="navigateTo('/masuk')"
    />

    <div class="flex flex-1 flex-col justify-center py-8">
      <span
        class="flex size-14 items-center justify-center rounded-2xl bg-primary-100/10 ring-1 ring-primary-100/15"
      >
        <UIcon name="i-material-symbols-lock-reset-rounded" class="size-7 text-white" />
      </span>
      <h1 class="mt-6 text-3xl font-extrabold tracking-tight text-white">
        Lupa kata sandi
      </h1>
      <p class="mt-2 text-sm text-primary-200">
        Masukkan email akun Anda, lalu kami buatkan tautan untuk mengatur ulang kata
        sandi.
      </p>

      <UForm
        v-if="!sent"
        :schema="validation"
        :state="state"
        class="mt-8 space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          name="email"
          label="Email"
          :ui="{ label: 'text-primary-200', error: 'text-red-300' }"
        >
          <UInput
            v-model="state.email"
            type="email"
            autocomplete="email"
            icon="i-material-symbols-mail-rounded"
            placeholder="nama@email.com"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Buat tautan atur ulang"
          color="primary"
          size="xl"
          block
          :loading="pending"
          :loading-auto="false"
          class="mt-2"
        />
      </UForm>

      <div v-else class="mt-8 space-y-4">
        <UAlert
          color="info"
          variant="subtle"
          icon="i-material-symbols-mark-email-read-rounded"
          title="Permintaan diterima"
          description="Jika email tersebut terdaftar, tautan atur ulang sudah dibuat dan berlaku selama satu jam."
        />

        <!--
          There is no mail transport yet. Rather than claim an email was sent,
          the link is handed over here and the copy says exactly why.
        -->
        <div
          v-if="resetUrl"
          class="rounded-xl border border-dashed border-primary-100/25 bg-primary-100/5 p-4"
        >
          <p class="text-sm font-semibold text-white">Pengiriman email belum aktif</p>
          <p class="mt-1 text-xs leading-relaxed text-primary-200">
            Selama layanan email disiapkan, tautan atur ulang ditampilkan langsung di
            sini. Buka tautan ini untuk melanjutkan.
          </p>
          <UButton
            :to="resetUrl"
            label="Atur ulang kata sandi sekarang"
            icon="i-material-symbols-key-rounded"
            color="primary"
            size="lg"
            block
            class="mt-3"
          />
        </div>

        <UButton
          to="/masuk"
          label="Kembali ke halaman masuk"
          color="neutral"
          variant="ghost"
          block
          class="text-primary-200 hover:bg-white/10 hover:text-white"
        />
      </div>
    </div>
  </div>
</template>
