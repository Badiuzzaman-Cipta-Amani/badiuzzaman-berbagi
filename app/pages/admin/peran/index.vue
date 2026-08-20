<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { AdminPermission } from "~~/shared/constants/permission"
import type { AdminRoleInput } from "~~/shared/validation/admin"

import { ADMIN_PERMISSION_GROUPS } from "~~/shared/constants/permission"

import {
  deleteAdminRole,
  getListAdminRole,
  postAdminRole,
  putAdminRole,
} from "~/services/admin/account"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const toast = useToast()

const { run } = getListAdminRole()
const { data, status, error, refresh } = run()

const roles = computed(() => data.value?.data ?? [])
const loading = computed(() => status.value === "pending")

/* Create / edit ----------------------------------------------------------- */

const formOpen = ref(false)
const editing = ref<AdminRoleItem | null>(null)

const state = reactive({
  name: "",
  label: "",
  description: "",
  permissions: [] as AdminPermission[],
})

const { body: createBody, validation, run: runCreate } = postAdminRole()
const { execute: create, pending: creating } = runCreate()

const { params: updateParams, body: updateBody, run: runUpdate } = putAdminRole()
const { execute: update, pending: updating } = runUpdate()

const saving = computed(() => creating.value || updating.value)

/** `super_admin` holds everything implicitly, so its checkboxes are read-only. */
const editingSystemRole = computed(() => Boolean(editing.value?.isSystem))

const openCreate = () => {
  editing.value = null
  Object.assign(state, { name: "", label: "", description: "", permissions: [] })
  formOpen.value = true
}

const openEdit = (role: AdminRoleItem) => {
  editing.value = role
  Object.assign(state, {
    name: role.name,
    label: role.label ?? "",
    description: role.description ?? "",
    permissions: [...role.permissions],
  })
  formOpen.value = true
}

/**
 * A new role gets its machine key derived from the display name, so an operator
 * never has to think about snake_case. Editing leaves the key alone — it is the
 * handle other rows point at.
 */
watch(
  () => state.label,
  (label) => {
    if (editing.value) return
    state.name = label
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40)
  },
)

const togglePermission = (permission: AdminPermission, checked: boolean) => {
  const next = new Set(state.permissions)
  if (checked) next.add(permission)
  else next.delete(permission)
  state.permissions = [...next]
}

const toggleGroup = (
  group: (typeof ADMIN_PERMISSION_GROUPS)[number],
  checked: boolean,
) => {
  const next = new Set(state.permissions)
  for (const item of group.items) {
    if (checked) next.add(item.value)
    else next.delete(item.value)
  }
  state.permissions = [...next]
}

const groupChecked = (group: (typeof ADMIN_PERMISSION_GROUPS)[number]) =>
  group.items.every((item) => state.permissions.includes(item.value))

const onSubmit = async (event: FormSubmitEvent<AdminRoleInput>) => {
  try {
    let message: string

    if (editing.value) {
      updateParams.value.id = String(editing.value.id)
      updateBody.value = event.data
      message = (await update()).message
    } else {
      createBody.value = event.data
      message = (await create()).message
    }

    formOpen.value = false
    await refresh()
    toast.add({
      title: message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch (err) {
    toast.add({
      title: "Gagal menyimpan peran",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Periksa kembali isian.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

/* Delete ------------------------------------------------------------------ */

const confirmOpen = ref(false)
const target = ref<AdminRoleItem | null>(null)

const { params: deleteParams, run: runDelete } = deleteAdminRole()
const { execute: removeRole, pending: removing } = runDelete()

const askDelete = (role: AdminRoleItem) => {
  target.value = role
  confirmOpen.value = true
}

const confirmDelete = async () => {
  if (!target.value) return

  deleteParams.value.id = String(target.value.id)

  try {
    const response = await removeRole()
    confirmOpen.value = false
    await refresh()
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch (err) {
    toast.add({
      title: "Peran tidak dapat dihapus",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Silakan coba lagi.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

/** Permission labels for the card, so a role's reach is readable at a glance. */
const permissionLabels = new Map(
  ADMIN_PERMISSION_GROUPS.flatMap((group) =>
    group.items.map((item) => [item.value, item.label] as const),
  ),
)

useSeoMeta({ title: "Peran & Izin", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Peran & izin"
      description="Kelompok akses admin. Izin yang dicentang di sini menentukan menu dan tindakan yang dapat dibuka pemegang peran."
    >
      <template #actions>
        <UButton
          to="/admin/pengguna"
          icon="i-material-symbols-shield-person-rounded"
          label="Akun admin"
          color="neutral"
          variant="outline"
          size="md"
        />
        <UButton
          icon="i-material-symbols-add-rounded"
          label="Tambah peran"
          color="primary"
          size="md"
          @click="openCreate"
        />
      </template>
    </AdminPageHeader>

    <AdminDataState
      :loading="loading"
      :error="error"
      :empty="!roles.length"
      :skeleton-rows="3"
      empty-icon="i-material-symbols-lock-person-rounded"
      empty-title="Belum ada peran"
      empty-description="Tambahkan peran untuk mengelompokkan akses admin."
      @retry="refresh()"
    >
      <ul class="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        <li v-for="role in roles" :key="role.id">
          <UCard class="h-full" :ui="{ body: 'p-4 sm:p-5' }">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="flex items-center gap-2 font-semibold text-highlighted">
                  <span class="truncate">{{ roleLabel(role) }}</span>
                  <UBadge
                    v-if="role.isSystem"
                    label="Sistem"
                    color="warning"
                    variant="subtle"
                    size="sm"
                  />
                </p>
                <p class="mt-0.5 truncate font-mono text-xs text-dimmed">
                  {{ role.name }}
                </p>
              </div>

              <div class="flex shrink-0 gap-1">
                <UButton
                  icon="i-material-symbols-edit-rounded"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :aria-label="`Ubah peran ${roleLabel(role)}`"
                  @click="openEdit(role)"
                />
                <UButton
                  icon="i-material-symbols-delete-outline-rounded"
                  color="error"
                  variant="ghost"
                  size="sm"
                  :disabled="role.isSystem || role.totalAdmin > 0"
                  :aria-label="`Hapus peran ${roleLabel(role)}`"
                  @click="askDelete(role)"
                />
              </div>
            </div>

            <p v-if="role.description" class="mt-3 text-sm leading-relaxed text-muted">
              {{ role.description }}
            </p>

            <div class="mt-4 flex flex-wrap gap-1.5">
              <UBadge
                v-for="permission in role.permissions.slice(0, 6)"
                :key="permission"
                :label="permissionLabels.get(permission) ?? permission"
                color="neutral"
                variant="subtle"
                size="sm"
              />
              <UBadge
                v-if="role.permissions.length > 6"
                :label="`+${role.permissions.length - 6} lainnya`"
                color="primary"
                variant="subtle"
                size="sm"
              />
              <span v-if="!role.permissions.length" class="text-sm text-dimmed">
                Belum ada izin
              </span>
            </div>

            <template #footer>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted">
                  <span class="numeric font-semibold text-toned">
                    {{ formatNumber(role.totalAdmin) }}
                  </span>
                  admin
                </span>
                <span class="text-xs text-dimmed">
                  Dibuat {{ formatDate(role.createdAt) }}
                </span>
              </div>
            </template>
          </UCard>
        </li>
      </ul>
    </AdminDataState>

    <UModal
      v-model:open="formOpen"
      :title="editing ? 'Ubah peran' : 'Tambah peran'"
      description="Nama tampilan adalah yang dibaca operator; kunci peran dipakai sistem untuk mencocokkan izin."
      :ui="{ content: 'max-w-2xl' }"
    >
      <template #body>
        <UForm
          id="admin-role-form"
          :schema="validation"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField name="label" label="Nama tampilan" required>
              <UInput v-model="state.label" placeholder="Tim Keuangan" class="w-full" />
            </UFormField>

            <UFormField
              name="name"
              label="Kunci peran"
              required
              :help="
                editing
                  ? 'Kunci tidak diubah otomatis agar tautan lama tetap cocok.'
                  : 'Dibuat otomatis dari nama tampilan.'
              "
            >
              <UInput
                v-model="state.name"
                :disabled="editingSystemRole"
                placeholder="tim_keuangan"
                class="w-full font-mono"
              />
            </UFormField>
          </div>

          <UFormField name="description" label="Keterangan">
            <UTextarea
              v-model="state.description"
              :rows="2"
              placeholder="Menangani verifikasi donasi dan laporan keuangan."
              class="w-full"
            />
          </UFormField>

          <UFormField name="permissions" label="Izin">
            <UAlert
              v-if="editingSystemRole"
              color="warning"
              variant="subtle"
              icon="i-material-symbols-verified-user-rounded"
              title="Peran super admin"
              description="Peran ini selalu memegang seluruh izin agar akses ke halaman ini tidak dapat terkunci."
              class="mb-3"
            />

            <div class="space-y-3">
              <div
                v-for="group in ADMIN_PERMISSION_GROUPS"
                :key="group.label"
                class="rounded-xl border border-default p-3"
              >
                <UCheckbox
                  :model-value="editingSystemRole || groupChecked(group)"
                  :label="group.label"
                  :disabled="editingSystemRole"
                  size="md"
                  :ui="{ label: 'font-semibold' }"
                  @update:model-value="toggleGroup(group, $event === true)"
                />

                <div class="mt-2 space-y-2 ps-6">
                  <UCheckbox
                    v-for="item in group.items"
                    :key="item.value"
                    :model-value="
                      editingSystemRole || state.permissions.includes(item.value)
                    "
                    :label="item.label"
                    :description="item.description"
                    :disabled="editingSystemRole"
                    size="md"
                    @update:model-value="togglePermission(item.value, $event === true)"
                  />
                </div>
              </div>
            </div>
          </UFormField>
        </UForm>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Batal"
            color="neutral"
            variant="outline"
            size="md"
            :disabled="saving"
            @click="formOpen = false"
          />
          <UButton
            type="submit"
            form="admin-role-form"
            :label="editing ? 'Simpan perubahan' : 'Tambah peran'"
            color="primary"
            size="md"
            :loading="saving"
            :loading-auto="false"
          />
        </div>
      </template>
    </UModal>

    <AdminConfirmModal
      v-model:open="confirmOpen"
      title="Hapus peran ini?"
      :description="`Peran “${roleLabel(target)}” akan dihapus. Peran yang masih dipakai admin tidak dapat dihapus.`"
      :loading="removing"
      @confirm="confirmDelete"
    />
  </div>
</template>
