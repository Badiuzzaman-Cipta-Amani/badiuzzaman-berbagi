<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from "@nuxt/ui"
import type {
  AdminAccountCreateInput,
  AdminAccountUpdateInput,
} from "~~/shared/validation/admin"

import {
  deleteAdminAccount,
  getListAdminRole,
  getPaginateAdminAccount,
  postAdminAccount,
  putAdminAccount,
} from "~/services/admin/account"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const toast = useToast()
const { admin: currentUser } = useAdminAuth()

const { query, run } = getPaginateAdminAccount({ query: { size: 15 } })
const { data, status, error, refresh } = run()

const accounts = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta)
const loading = computed(() => status.value === "pending")

const { run: runRoles } = getListAdminRole()
const { data: roleData } = runRoles()

const roles = computed(() => roleData.value?.data ?? [])

/** The picker shows the readable name; `roleId` is what actually gets stored. */
const roleItems = computed(() =>
  roles.value.map((role) => ({
    label: roleLabel(role),
    value: role.id,
    description: role.description ?? undefined,
  })),
)

const roleFilterItems = computed(() => [
  { label: "Semua peran", value: "" },
  ...roles.value.map((role) => ({ label: roleLabel(role), value: String(role.id) })),
])

const statusItems = [
  { label: "Semua status", value: "" },
  { label: "Aktif", value: "active" },
  { label: "Nonaktif", value: "inactive" },
]

/** Every filter change restarts paging — page 4 of the old result set is meaningless. */
const setSearch = (value: string) => {
  query.value.search = value
  query.value.page = 1
}

const setRole = (value: string) => {
  query.value.roleId = value ? Number(value) : ""
  query.value.page = 1
}

const setStatus = (value: string) => {
  query.value.status = value as AdminAccountStatusFilter
  query.value.page = 1
}

const columns: TableColumn<AdminAccountItem>[] = [
  { accessorKey: "name", header: "Admin" },
  { accessorKey: "role", header: "Peran" },
  { accessorKey: "isActive", header: "Status" },
  { accessorKey: "lastLoginAt", header: "Terakhir masuk" },
  { id: "action", header: "" },
]

const formOpen = ref(false)
const editing = ref<AdminAccountItem | null>(null)

const state = reactive({
  name: "",
  email: "",
  password: "",
  roleId: 0,
  isActive: true,
})

const { body: createBody, validation: createSchema, run: runCreate } = postAdminAccount()
const { execute: create, pending: creating } = runCreate()

const {
  params: updateParams,
  body: updateBody,
  validation: updateSchema,
  run: runUpdate,
} = putAdminAccount()
const { execute: update, pending: updating } = runUpdate()

const saving = computed(() => creating.value || updating.value)
const schema = computed(() => (editing.value ? updateSchema : createSchema))

const openCreate = () => {
  editing.value = null
  Object.assign(state, {
    name: "",
    email: "",
    password: "",
    roleId: roleItems.value[0]?.value ?? 0,
    isActive: true,
  })
  formOpen.value = true
}

const openEdit = (account: AdminAccountItem) => {
  editing.value = account
  Object.assign(state, {
    name: account.name,
    email: account.email,
    password: "",
    roleId: account.role.id,
    isActive: account.isActive,
  })
  formOpen.value = true
}

const onSubmit = async (
  event: FormSubmitEvent<AdminAccountCreateInput | AdminAccountUpdateInput>,
) => {
  try {
    let message: string

    if (editing.value) {
      updateParams.value.id = editing.value.id
      updateBody.value = event.data as AdminAccountUpdateInput
      message = (await update()).message
    } else {
      createBody.value = event.data as AdminAccountCreateInput
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
      title: "Gagal menyimpan admin",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Periksa kembali isian.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

const confirmOpen = ref(false)
const target = ref<AdminAccountItem | null>(null)

const { params: deleteParams, run: runDelete } = deleteAdminAccount()
const { execute: removeAccount, pending: removing } = runDelete()

const askDelete = (account: AdminAccountItem) => {
  target.value = account
  confirmOpen.value = true
}

const confirmDelete = async () => {
  if (!target.value) return

  deleteParams.value.id = target.value.id

  try {
    const response = await removeAccount()
    confirmOpen.value = false
    await refresh()
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch (err) {
    toast.add({
      title: "Admin tidak dapat dihapus",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Silakan coba lagi.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

useSeoMeta({ title: "Kelola Admin", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Akun admin"
      description="Siapa saja yang dapat masuk ke panel ini, dan peran yang menentukan aksesnya."
    >
      <template #actions>
        <UButton
          to="/admin/peran"
          icon="i-material-symbols-lock-person-rounded"
          label="Peran & izin"
          color="neutral"
          variant="outline"
          size="md"
        />
        <UButton
          icon="i-material-symbols-person-add-rounded"
          label="Tambah admin"
          color="primary"
          size="md"
          @click="openCreate"
        />
      </template>
    </AdminPageHeader>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <AdminSearchInput
            :model-value="query.search ?? ''"
            placeholder="Cari nama atau email..."
            class="lg:col-span-2"
            @update:model-value="setSearch"
          />
          <AdminFilterSelect
            :model-value="query.roleId ? String(query.roleId) : ''"
            :items="roleFilterItems"
            icon="i-material-symbols-lock-person-rounded"
            @update:model-value="setRole"
          />
          <AdminFilterSelect
            :model-value="query.status ?? ''"
            :items="statusItems"
            icon="i-material-symbols-filter-alt-rounded"
            @update:model-value="setStatus"
          />
        </div>
      </template>

      <div class="p-5 sm:p-6">
        <AdminDataState
          :loading="loading"
          :error="error"
          :empty="!accounts.length"
          empty-icon="i-material-symbols-shield-person-rounded"
          empty-title="Belum ada admin"
          empty-description="Tambahkan admin agar tim dapat mengelola donasi."
          @retry="refresh()"
        >
          <UTable :data="accounts" :columns="columns" class="w-full">
            <template #name-cell="{ row }">
              <div class="min-w-0">
                <p class="truncate font-medium text-highlighted">
                  {{ row.original.name }}
                  <span
                    v-if="row.original.id === currentUser?.id"
                    class="text-xs font-normal text-muted"
                  >
                    (Anda)
                  </span>
                </p>
                <p class="truncate text-xs text-muted">{{ row.original.email }}</p>
              </div>
            </template>

            <template #role-cell="{ row }">
              <UBadge
                :label="roleLabel(row.original.role)"
                color="primary"
                variant="subtle"
              />
            </template>

            <template #isActive-cell="{ row }">
              <UBadge
                :label="row.original.isActive ? 'Aktif' : 'Nonaktif'"
                :color="row.original.isActive ? 'success' : 'neutral'"
                variant="subtle"
              />
            </template>

            <template #lastLoginAt-cell="{ row }">
              <span class="text-muted">
                {{
                  row.original.lastLoginAt
                    ? formatRelativeTime(row.original.lastLoginAt)
                    : "Belum pernah"
                }}
              </span>
            </template>

            <template #action-cell="{ row }">
              <div class="flex justify-end gap-1">
                <UButton
                  icon="i-material-symbols-edit-rounded"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :aria-label="`Ubah ${row.original.name}`"
                  @click="openEdit(row.original)"
                />
                <UButton
                  icon="i-material-symbols-delete-outline-rounded"
                  color="error"
                  variant="ghost"
                  size="sm"
                  :disabled="row.original.id === currentUser?.id"
                  :aria-label="`Hapus ${row.original.name}`"
                  @click="askDelete(row.original)"
                />
              </div>
            </template>
          </UTable>

          <AdminTableFooter
            v-if="meta"
            :meta="meta"
            :size="query.size ?? 15"
            noun="admin"
            @update:page="query.page = $event"
          />
        </AdminDataState>
      </div>
    </UCard>

    <UModal
      v-model:open="formOpen"
      :title="editing ? 'Ubah admin' : 'Tambah admin'"
      :description="
        editing
          ? 'Kosongkan kata sandi bila tidak ingin menggantinya.'
          : 'Admin baru dapat langsung masuk dengan email dan kata sandi ini.'
      "
    >
      <template #content>
        <UForm :schema="schema" :state="state" class="p-4 sm:p-6" @submit="onSubmit">
          <div class="space-y-4">
            <UFormField name="name" label="Nama" required>
              <UInput v-model="state.name" class="w-full" />
            </UFormField>

            <UFormField name="email" label="Email" required>
              <UInput v-model="state.email" type="email" class="w-full" />
            </UFormField>

            <UFormField name="roleId" label="Peran" required>
              <USelectMenu
                v-model="state.roleId"
                :items="roleItems"
                value-key="value"
                placeholder="Pilih peran"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="password"
              label="Kata sandi"
              :required="!editing"
              :help="
                editing ? 'Kosongkan untuk mempertahankan kata sandi lama.' : undefined
              "
            >
              <UInput
                v-model="state.password"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>

            <UFormField name="isActive" label="Status akun">
              <USwitch
                v-model="state.isActive"
                :label="state.isActive ? 'Aktif' : 'Nonaktif'"
                :disabled="editing?.id === currentUser?.id"
              />
            </UFormField>
          </div>

          <div class="mt-6 flex justify-end gap-2">
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
              :label="editing ? 'Simpan perubahan' : 'Tambah admin'"
              color="primary"
              size="md"
              :loading="saving"
            />
          </div>
        </UForm>
      </template>
    </UModal>

    <AdminConfirmModal
      v-model:open="confirmOpen"
      title="Hapus admin ini?"
      :description="`Akun “${target?.name}” akan dihapus permanen. Admin yang pernah memverifikasi donasi harus dinonaktifkan, bukan dihapus.`"
      :loading="removing"
      @confirm="confirmDelete"
    />
  </div>
</template>
