<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { ResetPasswordInput } from "~~/shared/validation/auth"

import { postResetPassword } from "~/services/auth"

definePageMeta({
  layout: "auth",
  middleware: "auth-guest",
})

const route = useRoute()
const toast = useToast()

const { body, validation, run } = postResetPassword()
const { execute: reset, pending } = run()

// The token rides in the query string of the link the donor was handed.
const token = computed(() => String(route.query.token ?? ""))

const state = reactive({ token: token.value, password: "", confirmPassword: "" })
const showPassword = ref(false)

watch(token, (value) => (state.token = value))

const onSubmit = async (event: FormSubmitEvent<ResetPasswordInput>) => {
  body.value = event.data

  try {
    const response = await reset()
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
    await navigateTo("/masuk")
  } catch (error) {
    toast.add({
      title: "Gagal mengatur ulang kata sandi",
      description:
        (error as { statusMessage?: string })?.statusMessage ??
        "Tautan mungkin sudah kedaluwarsa. Silakan minta yang baru.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

usePageSeo({
  title: "Atur Ulang Kata Sandi",
  description: "Buat kata sandi baru untuk akun Badiuzzaman Berbagi Anda.",
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
        <UIcon name="i-material-symbols-key-rounded" class="size-7 text-white" />
      </span>
      <h1 class="mt-6 text-3xl font-extrabold tracking-tight text-white">
        Kata sandi baru
      </h1>
      <p class="mt-2 text-sm text-primary-200">
        Buat kata sandi baru untuk akun Anda. Tautan ini hanya berlaku sekali.
      </p>

      <!-- Landing here without a token means the link was truncated somewhere. -->
      <UAlert
        v-if="!token"
        color="warning"
        variant="subtle"
        icon="i-material-symbols-link-off-rounded"
        title="Tautan tidak lengkap"
        description="Buka halaman ini melalui tautan atur ulang yang Anda terima, atau minta tautan baru."
        class="mt-8"
        :actions="[
          {
            label: 'Minta tautan baru',
            color: 'warning',
            variant: 'solid',
            to: '/lupa-sandi',
          },
        ]"
      />

      <UForm
        v-else
        :schema="validation"
        :state="state"
        class="mt-8 space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          name="password"
          label="Kata sandi baru"
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
          label="Konfirmasi kata sandi baru"
          :ui="{ label: 'text-primary-200', error: 'text-red-300' }"
        >
          <UInput
            v-model="state.confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            icon="i-material-symbols-lock-rounded"
            placeholder="Ulangi kata sandi baru"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Simpan kata sandi"
          color="primary"
          size="xl"
          block
          :loading="pending"
          :loading-auto="false"
          class="mt-2"
        />
      </UForm>
    </div>
  </div>
</template>
