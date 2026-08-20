<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { AdminPasswordInput, AdminProfileInput } from "~~/shared/validation/admin"

import { ADMIN_PERMISSION_GROUPS } from "~~/shared/constants/permission"

import { putAdminPassword, putAdminProfile } from "~/services/admin/auth"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const toast = useToast()
const { admin, setSession } = useAdminAuth()

/* Identity ---------------------------------------------------------------- */

const profileState = reactive({ name: "", email: "" })

// The session resolves after the first paint, so seed the form when it lands.
watchEffect(() => {
  profileState.name = admin.value?.name ?? ""
  profileState.email = admin.value?.email ?? ""
})

const {
  body: profileBody,
  validation: profileSchema,
  run: runProfile,
} = putAdminProfile()
const { execute: saveProfile, pending: savingProfile } = runProfile()

const onSubmitProfile = async (event: FormSubmitEvent<AdminProfileInput>) => {
  profileBody.value = event.data

  try {
    const response = await saveProfile()
    // The navbar and the sidebar read the session, so refresh it in place.
    setSession(response.data)
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch (error) {
    toast.add({
      title: "Gagal menyimpan profil",
      description:
        (error as { statusMessage?: string })?.statusMessage ?? "Periksa kembali isian.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

/* Password ---------------------------------------------------------------- */

const passwordState = reactive({
  currentPassword: "",
  password: "",
  passwordConfirmation: "",
})

const {
  body: passwordBody,
  validation: passwordSchema,
  run: runPassword,
} = putAdminPassword()
const { execute: savePassword, pending: savingPassword } = runPassword()

const onSubmitPassword = async (event: FormSubmitEvent<AdminPasswordInput>) => {
  passwordBody.value = event.data

  try {
    const response = await savePassword()
    Object.assign(passwordState, {
      currentPassword: "",
      password: "",
      passwordConfirmation: "",
    })
    toast.add({
      title: response.message,
      icon: "i-material-symbols-lock-reset-rounded",
      color: "success",
    })
  } catch (error) {
    toast.add({
      title: "Gagal mengganti kata sandi",
      description:
        (error as { statusMessage?: string })?.statusMessage ?? "Periksa kembali isian.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

/* Permissions ------------------------------------------------------------- */

/** What this role actually grants, read from the session rather than the role table. */
const grants = computed(() =>
  ADMIN_PERMISSION_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => admin.value?.permissions.includes(item.value)),
  })).filter((group) => group.items.length),
)

useSeoMeta({ title: "Profil Admin", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Profil saya"
      description="Ubah data akun Anda sendiri dan ganti kata sandi."
    />

    <div class="grid gap-4 xl:grid-cols-3">
      <div class="space-y-4 xl:col-span-2">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-highlighted">Informasi akun</h3>
          </template>

          <UForm
            id="admin-profile"
            :schema="profileSchema"
            :state="profileState"
            class="space-y-4"
            @submit="onSubmitProfile"
          >
            <UFormField name="name" label="Nama" required>
              <UInput v-model="profileState.name" class="w-full" />
            </UFormField>

            <UFormField
              name="email"
              label="Email"
              required
              help="Email ini adalah identitas login Anda."
            >
              <UInput
                v-model="profileState.email"
                type="email"
                autocomplete="email"
                class="w-full"
              />
            </UFormField>
          </UForm>

          <template #footer>
            <UButton
              type="submit"
              form="admin-profile"
              label="Simpan perubahan"
              icon="i-material-symbols-save-rounded"
              color="primary"
              size="md"
              :loading="savingProfile"
              :loading-auto="false"
            />
          </template>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-highlighted">Ganti kata sandi</h3>
          </template>

          <UForm
            id="admin-password"
            :schema="passwordSchema"
            :state="passwordState"
            class="space-y-4"
            @submit="onSubmitPassword"
          >
            <UFormField name="currentPassword" label="Kata sandi saat ini" required>
              <UInput
                v-model="passwordState.currentPassword"
                type="password"
                autocomplete="current-password"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="password"
              label="Kata sandi baru"
              required
              help="Minimal 8 karakter."
            >
              <UInput
                v-model="passwordState.password"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="passwordConfirmation"
              label="Ulangi kata sandi baru"
              required
            >
              <UInput
                v-model="passwordState.passwordConfirmation"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>
          </UForm>

          <template #footer>
            <UButton
              type="submit"
              form="admin-password"
              label="Perbarui kata sandi"
              icon="i-material-symbols-lock-reset-rounded"
              color="primary"
              size="md"
              :loading="savingPassword"
              :loading-auto="false"
            />
          </template>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-highlighted">Peran dan izin</h3>
        </template>

        <div class="flex items-center gap-3">
          <UAvatar
            icon="i-material-symbols-verified-user-rounded"
            size="lg"
            :ui="{ root: 'bg-primary-100 text-primary shrink-0' }"
          />
          <div class="min-w-0">
            <p class="truncate font-semibold text-highlighted">
              {{ roleLabel(admin?.role) }}
            </p>
            <p class="truncate text-xs text-muted">
              Terakhir masuk
              {{
                admin?.lastLoginAt
                  ? formatRelativeTime(admin.lastLoginAt)
                  : "belum pernah"
              }}
            </p>
          </div>
        </div>

        <div class="mt-5 space-y-4 border-t border-default pt-4">
          <div v-for="group in grants" :key="group.label">
            <p class="text-xs font-semibold tracking-wide text-dimmed uppercase">
              {{ group.label }}
            </p>
            <ul class="mt-1.5 space-y-1">
              <li
                v-for="item in group.items"
                :key="item.value"
                class="flex items-start gap-2 text-sm text-toned"
              >
                <UIcon
                  name="i-material-symbols-check-circle-rounded"
                  class="mt-0.5 size-4 shrink-0 text-success"
                />
                {{ item.label }}
              </li>
            </ul>
          </div>

          <p v-if="!grants.length" class="text-sm text-muted">
            Peran Anda belum diberi izin apa pun. Hubungi super admin.
          </p>
        </div>

        <template #footer>
          <p class="text-xs leading-relaxed text-dimmed">
            Izin ditetapkan oleh peran Anda dan hanya dapat diubah dari menu Peran &amp;
            Izin.
          </p>
        </template>
      </UCard>
    </div>
  </div>
</template>
