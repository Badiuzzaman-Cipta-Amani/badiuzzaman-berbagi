<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from "@nuxt/ui"
import type { AdminFundraiserInput } from "~~/shared/validation/admin"

import {
  deleteAdminFundraiser,
  getPaginateAdminFundraiser,
  postAdminFundraiser,
  putAdminFundraiser,
} from "~/services/admin/content"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const toast = useToast()

const { query, run } = getPaginateAdminFundraiser({ query: { size: 15 } })
const { data, status, error, refresh } = run()

const setSearch = (value: string) => {
  query.value.search = value
  query.value.page = 1
}

const fundraisers = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta)
const loading = computed(() => status.value === "pending")

const columns: TableColumn<AdminFundraiserItem>[] = [
  { accessorKey: "name", header: "Lembaga" },
  { accessorKey: "totalCampaign", header: "Campaign" },
  { accessorKey: "totalRaised", header: "Dana terkumpul" },
  { accessorKey: "createdAt", header: "Terdaftar" },
  { id: "action", header: "" },
]

const formOpen = ref(false)
const editing = ref<AdminFundraiserItem | null>(null)
const state = reactive({ name: "", googleMaps: "", description: "" })

const { body: createBody, validation, run: runCreate } = postAdminFundraiser()
const { execute: create, pending: creating } = runCreate()

const { params: updateParams, body: updateBody, run: runUpdate } = putAdminFundraiser()
const { execute: update, pending: updating } = runUpdate()

const saving = computed(() => creating.value || updating.value)

const openCreate = () => {
  editing.value = null
  Object.assign(state, { name: "", googleMaps: "", description: "" })
  formOpen.value = true
}

const openEdit = (fundraiser: AdminFundraiserItem) => {
  editing.value = fundraiser
  Object.assign(state, {
    name: fundraiser.name,
    googleMaps: fundraiser.googleMaps ?? "",
    description: fundraiser.description ?? "",
  })
  formOpen.value = true
}

const onSubmit = async (event: FormSubmitEvent<AdminFundraiserInput>) => {
  try {
    let message: string

    if (editing.value) {
      updateParams.value.id = editing.value.id
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
      title: "Gagal menyimpan lembaga",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Periksa kembali isian.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

const confirmOpen = ref(false)
const target = ref<AdminFundraiserItem | null>(null)

const { params: deleteParams, run: runDelete } = deleteAdminFundraiser()
const { execute: removeFundraiser, pending: removing } = runDelete()

const askDelete = (fundraiser: AdminFundraiserItem) => {
  target.value = fundraiser
  confirmOpen.value = true
}

const confirmDelete = async () => {
  if (!target.value) return

  deleteParams.value.id = target.value.id

  try {
    const response = await removeFundraiser()
    confirmOpen.value = false
    await refresh()
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch (err) {
    toast.add({
      title: "Lembaga tidak dapat dihapus",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Silakan coba lagi.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

useSeoMeta({ title: "Kelola Lembaga", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Lembaga"
      description="Organisasi penggalang yang menaungi campaign."
    >
      <template #actions>
        <UButton
          icon="i-material-symbols-add-rounded"
          label="Tambah lembaga"
          color="primary"
          size="md"
          @click="openCreate"
        />
      </template>
    </AdminPageHeader>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <AdminSearchInput
          :model-value="query.search ?? ''"
          placeholder="Cari nama lembaga..."
          class="w-full sm:max-w-sm"
          @update:model-value="setSearch"
        />
      </template>

      <div class="p-5 sm:p-6">
        <AdminDataState
          :loading="loading"
          :error="error"
          :empty="!fundraisers.length"
          empty-icon="i-material-symbols-account-balance-rounded"
          empty-title="Belum ada lembaga"
          empty-description="Tambahkan lembaga agar dapat dipilih saat membuat campaign."
          @retry="refresh()"
        >
          <UTable :data="fundraisers" :columns="columns" class="w-full">
            <template #name-cell="{ row }">
              <div class="max-w-sm min-w-0">
                <p class="truncate font-medium text-highlighted">
                  {{ row.original.name }}
                </p>
                <p
                  v-if="row.original.description"
                  class="line-clamp-2 text-xs text-muted"
                >
                  {{ row.original.description }}
                </p>
                <ULink
                  v-if="row.original.googleMaps"
                  :to="row.original.googleMaps"
                  target="_blank"
                  class="mt-0.5 inline-flex items-center gap-1 text-xs text-primary-700 hover:underline"
                >
                  <UIcon name="i-material-symbols-location-on-rounded" class="size-3.5" />
                  Lihat lokasi
                </ULink>
              </div>
            </template>

            <template #totalCampaign-cell="{ row }">
              <span class="numeric font-medium text-toned">
                {{ formatNumber(row.original.totalCampaign) }}
              </span>
            </template>

            <template #totalRaised-cell="{ row }">
              <span class="numeric font-semibold text-highlighted">
                {{ formatCurrency(row.original.totalRaised) }}
              </span>
            </template>

            <template #createdAt-cell="{ row }">
              <span class="text-muted">{{ formatDate(row.original.createdAt) }}</span>
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
            noun="lembaga"
            @update:page="query.page = $event"
          />
        </AdminDataState>
      </div>
    </UCard>

    <UModal
      v-model:open="formOpen"
      :title="editing ? 'Ubah lembaga' : 'Tambah lembaga'"
      description="Nama lembaga tampil pada halaman detail campaign."
    >
      <template #content>
        <UForm :schema="validation" :state="state" class="p-4 sm:p-6" @submit="onSubmit">
          <div class="space-y-4">
            <UFormField name="name" label="Nama lembaga" required>
              <UInput
                v-model="state.name"
                placeholder="Yayasan Peduli Sesama"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="googleMaps"
              label="Tautan Google Maps"
              help="Tempelkan tautan dari tombol Bagikan di Google Maps. Peta lokasinya ikut tampil pada halaman detail campaign."
            >
              <UInput
                v-model="state.googleMaps"
                placeholder="https://maps.google.com/?q=..."
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="description"
              label="Deskripsi"
              help="Perkenalan singkat lembaga, tampil di kartu penggalang dana."
            >
              <UTextarea
                v-model="state.description"
                :rows="4"
                :maxlength="500"
                placeholder="Lembaga sosial yang fokus pada pembangunan sarana air bersih di wilayah terpencil."
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
              :label="editing ? 'Simpan perubahan' : 'Tambah lembaga'"
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
      title="Hapus lembaga ini?"
      :description="`“${target?.name}” akan dihapus. Lembaga yang masih menaungi campaign tidak dapat dihapus.`"
      :loading="removing"
      @confirm="confirmDelete"
    />
  </div>
</template>
