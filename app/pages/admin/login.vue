<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { AdminLoginInput } from "~~/shared/validation/admin"

import { postAdminLogin } from "~/services/admin/auth"

definePageMeta({
  layout: false,
  middleware: "admin-guest",
})

const route = useRoute()
const toast = useToast()
const { setSession } = useAdminAuth()

const { body, validation, run } = postAdminLogin()
const { execute, pending } = run()

const state = reactive({ email: "", password: "" })
const showPassword = ref(false)

const onSubmit = async (event: FormSubmitEvent<AdminLoginInput>) => {
  body.value = { email: event.data.email, password: event.data.password }

  try {
    const response = await execute()
    setSession(response.data)

    toast.add({
      title: `Selamat datang, ${response.data.name}`,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })

    // `redirect` is whatever the guard captured, so a deep link survives login.
    const redirect = String(route.query.redirect ?? "/admin")
    await navigateTo(redirect.startsWith("/admin") ? redirect : "/admin")
  } catch (error) {
    toast.add({
      title: "Gagal masuk",
      description:
        (error as { statusMessage?: string })?.statusMessage ??
        "Email atau kata sandi salah.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

useSeoMeta({ title: "Masuk Admin", robots: "noindex, nofollow" })
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-primary-900 px-4 py-10">
    <div class="w-full max-w-sm">
      <span
        class="flex size-14 items-center justify-center rounded-2xl bg-primary-100/10 ring-1 ring-primary-100/15"
      >
        <UIcon name="i-material-symbols-mosque-rounded" class="size-7 text-white" />
      </span>

      <h1 class="mt-6 text-2xl font-extrabold tracking-tight text-white">Panel Admin</h1>
      <p class="mt-2 text-sm text-primary-200">
        Masuk dengan akun admin untuk mengelola donasi dan campaign.
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
            placeholder="admin@badiuzzaman.co.id"
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

        <UButton
          type="submit"
          label="Masuk"
          color="primary"
          size="xl"
          block
          :loading="pending"
          class="mt-2"
        />
      </UForm>

      <NuxtLink
        to="/"
        class="mt-8 block text-center text-sm text-primary-200 hover:text-white"
      >
        Kembali ke situs
      </NuxtLink>
    </div>
  </div>
</template>
