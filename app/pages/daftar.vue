<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { RegisterInput } from "~~/shared/validation/auth"

import { postUserRegister } from "~/services/auth"

definePageMeta({
  layout: "auth",
  middleware: "auth-guest",
})

const toast = useToast()
const { setUser } = useAuth()

const { body, validation, run } = postUserRegister()
const { execute: register, pending } = run()

const state = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
})
const showPassword = ref(false)

const onSubmit = async (event: FormSubmitEvent<RegisterInput>) => {
  body.value = event.data

  try {
    const response = await register()
    // The endpoint signs you in as it creates the account, so land on it.
    setUser(response.data)
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
    await navigateTo("/akun")
  } catch (error) {
    toast.add({
      title: "Pendaftaran gagal",
      description:
        (error as { statusMessage?: string })?.statusMessage ??
        "Periksa kembali isian Anda.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

usePageSeo({
  title: "Daftar Akun",
  description:
    "Daftar akun Badiuzzaman Berbagi dan mulai perjalanan kebaikan Anda bersama ribuan dermawan di Indonesia.",
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
        <UIcon name="i-material-symbols-person-add-rounded" class="size-7 text-white" />
      </span>
      <h1 class="mt-6 text-3xl font-extrabold tracking-tight text-white">Daftar akun</h1>
      <p class="mt-2 text-sm text-primary-200">Bergabung untuk menyebarkan kebaikan.</p>

      <UForm
        :schema="validation"
        :state="state"
        class="mt-8 space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          name="name"
          label="Nama lengkap"
          :ui="{ label: 'text-primary-200', error: 'text-red-300' }"
        >
          <UInput
            v-model="state.name"
            autocomplete="name"
            icon="i-material-symbols-person-rounded"
            placeholder="Nama lengkap Anda"
            class="w-full"
          />
        </UFormField>

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

        <UFormField
          name="phone"
          label="Nomor WhatsApp"
          hint="Opsional"
          :ui="{
            label: 'text-primary-200',
            error: 'text-red-300',
            hint: 'text-primary-200/70',
          }"
        >
          <UInput
            v-model="state.phone"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            icon="i-material-symbols-call-rounded"
            placeholder="08123456789"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="password"
          label="Kata sandi"
          :ui="{ label: 'text-primary-200', error: 'text-red-300' }"
        >
          <UInput
            v-model="state.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            icon="i-material-symbols-lock-rounded"
            placeholder="Minimal 8 karakter"
            class="w-full"
          >
            <template #trailing>
              <UButton
                :icon="
                  showPassword
                    ? 'i-material-symbols-visibility-off-rounded'
                    : 'i-material-symbols-visibility-rounded'
                "
                :aria-label="
                  showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
                "
                :aria-pressed="showPassword"
                color="neutral"
                variant="link"
                size="sm"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField
          name="confirmPassword"
          label="Konfirmasi kata sandi"
          :ui="{ label: 'text-primary-200', error: 'text-red-300' }"
        >
          <UInput
            v-model="state.confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            icon="i-material-symbols-lock-rounded"
            placeholder="Ulangi kata sandi"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Daftar"
          color="primary"
          size="xl"
          block
          :loading="pending"
          :loading-auto="false"
          class="mt-2"
        />
      </UForm>

      <p class="mt-8 text-center text-sm text-primary-200">
        Sudah punya akun?
        <NuxtLink to="/masuk" class="font-semibold text-white hover:underline">
          Masuk sekarang
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
