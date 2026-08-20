<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { UserPasswordInput, UserProfileInput } from "~~/shared/validation/auth"

import { putUserPassword, putUserProfile } from "~/services/auth"

definePageMeta({
  layout: "detail",
  middleware: "auth",
})

const toast = useToast()
const { user, setUser } = useAuth()

/* Profile ----------------------------------------------------------------- */

const { body: profileBody, validation: profileSchema, run: runProfile } = putUserProfile()
const { execute: saveProfile, pending: savingProfile } = runProfile()

const profile = reactive({
  name: user.value?.name ?? "",
  email: user.value?.email ?? "",
  phone: user.value?.phone ?? "",
})

// The guard resolves the session before this page renders, but a hard reload can
// still land here with `user` filled in a tick later.
watch(user, (value) => {
  if (!value) return
  profile.name = value.name
  profile.email = value.email
  profile.phone = value.phone ?? ""
})

const onSaveProfile = async (event: FormSubmitEvent<UserProfileInput>) => {
  profileBody.value = event.data

  try {
    const response = await saveProfile()
    setUser(response.data)
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch (error) {
    toast.add({
      title: "Profil gagal disimpan",
      description:
        (error as { statusMessage?: string })?.statusMessage ??
        "Periksa kembali isian Anda.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

/* Password ---------------------------------------------------------------- */

const {
  body: passwordBody,
  validation: passwordSchema,
  run: runPassword,
} = putUserPassword()
const { execute: savePassword, pending: savingPassword } = runPassword()

const password = reactive({
  currentPassword: "",
  password: "",
  confirmPassword: "",
})

const onSavePassword = async (event: FormSubmitEvent<UserPasswordInput>) => {
  passwordBody.value = event.data

  try {
    const response = await savePassword()
    Object.assign(password, {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    })
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch (error) {
    toast.add({
      title: "Kata sandi gagal diubah",
      description:
        (error as { statusMessage?: string })?.statusMessage ??
        "Periksa kembali isian Anda.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

usePageSeo({
  title: "Ubah Profil",
  description: "Perbarui data akun Badiuzzaman Berbagi Anda.",
  type: "website",
})
</script>

<template>
  <main class="pb-28">
    <LayoutBackHeader title="Ubah profil" fallback="/akun" />

    <div class="px-gutter pt-6">
      <section aria-labelledby="profil-heading">
        <h2 id="profil-heading" class="text-lg font-bold text-highlighted">Data akun</h2>

        <UForm
          :schema="profileSchema"
          :state="profile"
          class="mt-4 space-y-4"
          @submit="onSaveProfile"
        >
          <UFormField name="name" label="Nama lengkap" required>
            <UInput v-model="profile.name" autocomplete="name" class="w-full" />
          </UFormField>

          <UFormField name="email" label="Email" required>
            <UInput
              v-model="profile.email"
              type="email"
              autocomplete="email"
              class="w-full"
            />
          </UFormField>

          <UFormField name="phone" label="Nomor WhatsApp" hint="Opsional">
            <UInput
              v-model="profile.phone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="08123456789"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            label="Simpan perubahan"
            color="primary"
            size="xl"
            block
            :loading="savingProfile"
            :loading-auto="false"
          />
        </UForm>
      </section>

      <section class="mt-10 border-t border-default pt-8" aria-labelledby="sandi-heading">
        <h2 id="sandi-heading" class="text-lg font-bold text-highlighted">
          Ganti kata sandi
        </h2>
        <p class="mt-1 text-sm text-muted">
          Masukkan kata sandi saat ini untuk membuktikan bahwa ini memang Anda.
        </p>

        <UForm
          :schema="passwordSchema"
          :state="password"
          class="mt-4 space-y-4"
          @submit="onSavePassword"
        >
          <UFormField name="currentPassword" label="Kata sandi saat ini" required>
            <UInput
              v-model="password.currentPassword"
              type="password"
              autocomplete="current-password"
              class="w-full"
            />
          </UFormField>

          <UFormField name="password" label="Kata sandi baru" required>
            <UInput
              v-model="password.password"
              type="password"
              autocomplete="new-password"
              placeholder="Minimal 8 karakter"
              class="w-full"
            />
          </UFormField>

          <UFormField name="confirmPassword" label="Konfirmasi kata sandi baru" required>
            <UInput
              v-model="password.confirmPassword"
              type="password"
              autocomplete="new-password"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            label="Ganti kata sandi"
            color="neutral"
            variant="outline"
            size="xl"
            block
            :loading="savingPassword"
            :loading-auto="false"
          />
        </UForm>
      </section>
    </div>
  </main>
</template>
