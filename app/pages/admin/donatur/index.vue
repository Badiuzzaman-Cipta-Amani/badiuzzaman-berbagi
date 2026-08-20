<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from "@nuxt/ui"
import type {
  AdminUserCreateInput,
  AdminUserUpdateInput,
} from "~~/shared/validation/admin"

import {
  deleteAdminUser,
  getPaginateAdminUser,
  postAdminUser,
  putAdminUser,
} from "~/services/admin/user"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const toast = useToast()

const { query, run } = getPaginateAdminUser({ query: { size: 15 } })
const { data, status, error, refresh } = run()

/** Every filter change restarts paging — page 4 of the old result set is meaningless. */
const setSearch = (value: string) => {
  query.value.search = value
  query.value.page = 1
}

const setSort = (value: string) => {
  query.value.sort = value as Required<PaginateAdminUser>["query"]["sort"]
  query.value.page = 1
}

const users = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta)
const loading = computed(() => status.value === "pending")

const sortItems = [
  { label: "Terbaru", value: "latest" },
  { label: "Terlama", value: "oldest" },
  { label: "Nama A–Z", value: "name" },
  { label: "Paling sering donasi", value: "highest_donation" },
]

const columns: TableColumn<AdminUserItem>[] = [
  { accessorKey: "name", header: "Donatur" },
  { accessorKey: "phone", header: "Telepon" },
  { accessorKey: "totalDonation", header: "Donasi" },
  { accessorKey: "totalDonated", header: "Total terverifikasi" },
  { accessorKey: "createdAt", header: "Bergabung" },
  { id: "action", header: "" },
]

/* Create / edit ----------------------------------------------------------- */

const formOpen = ref(false)
const editing = ref<AdminUserItem | null>(null)

const state = reactive({ name: "", email: "", phone: "", password: "" })

const { body: createBody, validation: createSchema, run: runCreate } = postAdminUser()
const { execute: create, pending: creating } = runCreate()

const {
  params: updateParams,
  body: updateBody,
  validation: updateSchema,
  run: runUpdate,
} = putAdminUser()
const { execute: update, pending: updating } = runUpdate()

const saving = computed(() => creating.value || updating.value)
const schema = computed(() => (editing.value ? updateSchema : createSchema))

const openCreate = () => {
  editing.value = null
  Object.assign(state, { name: "", email: "", phone: "", password: "" })
  formOpen.value = true
}

const openEdit = (user: AdminUserItem) => {
  editing.value = user
  Object.assign(state, {
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    password: "",
  })
  formOpen.value = true
}

const onSubmit = async (
  event: FormSubmitEvent<AdminUserCreateInput | AdminUserUpdateInput>,
) => {
  try {
    let message: string

    if (editing.value) {
      updateParams.value.id = editing.value.id
      updateBody.value = event.data as AdminUserUpdateInput
      message = (await update()).message
    } else {
      createBody.value = event.data as AdminUserCreateInput
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
      title: "Gagal menyimpan donatur",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Periksa kembali isian.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

/* Delete ------------------------------------------------------------------ */

const confirmOpen = ref(false)
const target = ref<AdminUserItem | null>(null)

const { params: deleteParams, run: runDelete } = deleteAdminUser()
const { execute: removeUser, pending: removing } = runDelete()

const askDelete = (user: AdminUserItem) => {
  target.value = user
  confirmOpen.value = true
}

const confirmDelete = async () => {
  if (!target.value) return

  deleteParams.value.id = target.value.id

  try {
    const response = await removeUser()
    confirmOpen.value = false
    await refresh()
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch (err) {
    toast.add({
      title: "Donatur tidak dapat dihapus",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Silakan coba lagi.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

useSeoMeta({ title: "Kelola Donatur", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Donatur"
      description="Akun donatur yang terdaftar beserta rekap donasinya."
    >
      <template #actions>
        <UButton
          icon="i-material-symbols-person-add-rounded"
          label="Tambah donatur"
          color="primary"
          size="md"
          @click="openCreate"
        />
      </template>
    </AdminPageHeader>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <div class="grid gap-2 sm:grid-cols-3">
          <AdminSearchInput
            :model-value="query.search ?? ''"
            placeholder="Cari nama, email, atau telepon..."
            class="sm:col-span-2"
            @update:model-value="setSearch"
          />
          <AdminFilterSelect
            :model-value="query.sort ?? 'latest'"
            :items="sortItems"
            icon="i-material-symbols-sort-rounded"
            @update:model-value="setSort"
          />
        </div>
      </template>

      <div class="p-5 sm:p-6">
        <AdminDataState
          :loading="loading"
          :error="error"
          :empty="!users.length"
          empty-icon="i-material-symbols-person-off-rounded"
          empty-title="Belum ada donatur"
          empty-description="Donatur yang membuat akun akan tampil di sini."
          @retry="refresh()"
        >
          <div class="-mx-5 overflow-x-auto sm:mx-0">
            <UTable :data="users" :columns="columns" class="w-full min-w-3xl">
              <template #name-cell="{ row }">
                <NuxtLink
                  :to="`/admin/donatur/${row.original.id}`"
                  class="block min-w-0 hover:underline"
                >
                  <p class="truncate font-medium text-highlighted">
                    {{ row.original.name }}
                  </p>
                  <p class="truncate text-xs text-muted">{{ row.original.email }}</p>
                </NuxtLink>
              </template>

              <template #phone-cell="{ row }">
                <span class="numeric text-muted">{{ row.original.phone ?? "—" }}</span>
              </template>

              <template #totalDonation-cell="{ row }">
                <span class="numeric font-medium text-toned">
                  {{ formatNumber(row.original.totalDonation) }}
                </span>
              </template>

              <template #totalDonated-cell="{ row }">
                <span class="numeric font-semibold text-highlighted">
                  {{ formatCurrency(row.original.totalDonated) }}
                </span>
              </template>

              <template #createdAt-cell="{ row }">
                <span class="text-muted">{{ formatDate(row.original.createdAt) }}</span>
              </template>

              <template #action-cell="{ row }">
                <div class="flex justify-end gap-1">
                  <UButton
                    :to="`/admin/donatur/${row.original.id}`"
                    icon="i-material-symbols-visibility-rounded"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :aria-label="`Lihat ${row.original.name}`"
                  />
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
                    :aria-label="`Hapus ${row.original.name}`"
                    @click="askDelete(row.original)"
                  />
                </div>
              </template>
            </UTable>
          </div>

          <AdminTableFooter
            v-if="meta"
            :meta="meta"
            :size="query.size ?? 15"
            noun="donatur"
            @update:page="query.page = $event"
          />
        </AdminDataState>
      </div>
    </UCard>

    <UModal
      v-model:open="formOpen"
      :title="editing ? 'Ubah donatur' : 'Tambah donatur'"
      :description="
        editing
          ? 'Kosongkan kata sandi bila tidak ingin menggantinya.'
          : 'Buatkan akun donatur secara manual.'
      "
    >
      <template #content>
        <UForm :schema="schema" :state="state" class="p-4 sm:p-6" @submit="onSubmit">
          <div class="space-y-4">
            <UFormField name="name" label="Nama lengkap" required>
              <UInput v-model="state.name" class="w-full" />
            </UFormField>

            <UFormField name="email" label="Email" required>
              <UInput v-model="state.email" type="email" class="w-full" />
            </UFormField>

            <UFormField name="phone" label="Telepon">
              <UInput v-model="state.phone" placeholder="081234567890" class="w-full" />
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
              :label="editing ? 'Simpan perubahan' : 'Tambah donatur'"
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
      title="Hapus donatur ini?"
      :description="`Akun “${target?.name}” akan dihapus. Riwayat donasinya tetap tersimpan, tetapi tidak lagi terhubung ke akun mana pun.`"
      :loading="removing"
      @confirm="confirmDelete"
    />
  </div>
</template>
