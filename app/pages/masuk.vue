<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { LoginInput } from "~~/shared/validation/auth"

import { postUserLogin } from "~/services/auth"

definePageMeta({
  layout: "auth",
  middleware: "auth-guest",
})

const route = useRoute()
const toast = useToast()
const { setUser } = useAuth()

const { body, validation, run } = postUserLogin()
const { execute: login, pending } = run()

const state = reactive({ email: "", password: "" })
const showPassword = ref(false)

/** Set by the guard when it bounced someone off a page that needs an account. */
const redirect = computed(() => {
  const target = String(route.query.redirect ?? "")
  // Only same-origin paths: an absolute URL here would be an open redirect.
  return target.startsWith("/") && !target.startsWith("//") ? target : "/akun"
})

const onSubmit = async (event: FormSubmitEvent<LoginInput>) => {
  body.value = event.data

  try {
    const response = await login()
    setUser(response.data)
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
    await navigateTo(redirect.value)
  } catch (error) {
    toast.add({
      title: "Gagal masuk",
      description:
        (error as { statusMessage?: string })?.statusMessage ??
        "Periksa koneksi Anda, lalu coba lagi.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

usePageSeo({
  title: "Masuk",
  description:
    "Masuk ke akun Badiuzzaman Berbagi Anda untuk melihat riwayat donasi dan kelola akun.",
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
      @click="navigateTo('/')"
    />

    <div class="flex flex-1 flex-col justify-center py-8">
      <span
        class="flex size-14 items-center justify-center rounded-2xl bg-primary-100/10 ring-1 ring-primary-100/15"
      >
        <UIcon
          name="i-material-symbols-volunteer-activism-rounded"
          class="size-7 text-white"
        />
      </span>
      <h1 class="mt-6 text-3xl font-extrabold tracking-tight text-white">
        Selamat datang
      </h1>
      <p class="mt-2 text-sm text-primary-200">
        Masuk untuk melanjutkan perjalanan kebaikan.
      </p>

      <UForm
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

        <UFormField
          name="password"
          label="Kata sandi"
          :ui="{ label: 'text-primary-200', error: 'text-red-300' }"
        >
          <UInput
            v-model="state.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            icon="i-material-symbols-lock-rounded"
            placeholder="Kata sandi Anda"
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

        <div class="flex justify-end">
          <NuxtLink
            to="/lupa-sandi"
            class="text-sm font-medium text-primary-200 hover:text-white hover:underline"
          >
            Lupa kata sandi?
          </NuxtLink>
        </div>

        <UButton
          type="submit"
          label="Masuk"
          color="primary"
          size="xl"
          block
          :loading="pending"
          :loading-auto="false"
          class="mt-2"
        />
      </UForm>

      <p class="mt-8 text-center text-sm text-primary-200">
        Belum punya akun?
        <NuxtLink to="/daftar" class="font-semibold text-white hover:underline">
          Daftar sekarang
        </NuxtLink>
      </p>

      <!--
        Said plainly rather than left implied: an account is for following your
        own donations, not a gate in front of giving.
      -->
      <p class="mt-3 text-center text-xs leading-relaxed text-primary-200/80">
        Anda tetap dapat berdonasi tanpa akun. Punya kode donasi?
        <NuxtLink to="/lacak-donasi" class="font-semibold text-white hover:underline">
          Lacak donasi Anda
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
