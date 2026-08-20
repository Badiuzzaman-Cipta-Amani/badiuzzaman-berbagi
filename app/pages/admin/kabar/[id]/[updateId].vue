<script setup lang="ts">
import {
  getDetailAdminCampaignUpdate,
  getDetailAdminUpdateCampaign,
  putAdminCampaignUpdate,
} from "~/services/admin/content"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const route = useRoute()
const toast = useToast()

const id = computed(() => String(route.params.id ?? ""))
const updateId = computed(() => String(route.params.updateId ?? ""))

const { params: campaignParams, run: runCampaign } = getDetailAdminUpdateCampaign({
  params: { id: id.value },
})
const { data: campaignData } = runCampaign()

const { params: detailParams, run: runDetail } = getDetailAdminCampaignUpdate({
  params: { id: updateId.value },
})
const { data, status, error, refresh } = runDetail()

watch(id, (value) => (campaignParams.value.id = value))
watch(updateId, (value) => (detailParams.value.id = value))

const campaign = computed(() => campaignData.value?.data ?? null)
const update = computed(() => data.value?.data ?? null)
const loading = computed(() => status.value === "pending")

const {
  params: updateParams,
  body,
  run: runUpdate,
} = putAdminCampaignUpdate({ params: { id: updateId.value } })
const { execute: save, pending } = runUpdate()

watch(updateId, (value) => (updateParams.value.id = value))

const onSubmit = async (payload: AdminCampaignUpdateBody) => {
  updateParams.value.id = updateId.value
  body.value = payload

  try {
    const response = await save()
    await refresh()
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch (err) {
    toast.add({
      title: "Perubahan gagal disimpan",
      description:
        (err as { statusMessage?: string })?.statusMessage ?? "Periksa kembali isian.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

useSeoMeta({ title: "Ubah Kabar", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      :title="update?.title ?? 'Ubah kabar'"
      description="Perubahan langsung berlaku pada halaman publik campaign ini."
      :back-to="`/admin/kabar/${id}`"
      back-label="Kembali ke daftar kabar"
    >
      <template #actions>
        <UButton
          v-if="campaign"
          :to="`/donasi/${campaign.slug}`"
          target="_blank"
          icon="i-material-symbols-open-in-new-rounded"
          label="Lihat publik"
          color="neutral"
          variant="outline"
          size="md"
        />
      </template>
    </AdminPageHeader>

    <USkeleton v-if="loading" class="h-96 w-full rounded-xl" />

    <UAlert
      v-else-if="error || !update"
      color="error"
      variant="subtle"
      icon="i-material-symbols-cloud-off-rounded"
      title="Kabar tidak dapat dimuat"
      description="Data mungkin sudah dihapus, atau koneksi Anda terputus."
      :actions="[
        {
          label: 'Coba lagi',
          color: 'error',
          variant: 'solid',
          onClick: () => refresh(),
        },
      ]"
    />

    <!--
      The same form the create page uses, so writing and correcting a kabar are
      the same screen rather than two things to learn.
    -->
    <AdminUpdateForm
      v-else
      :campaign-id="id"
      :campaign-title="campaign?.title ?? update.campaign?.title ?? '—'"
      :cancel-to="`/admin/kabar/${id}`"
      :initial="update"
      submit-label="Simpan perubahan"
      :pending="pending"
      @submit="onSubmit"
    />
  </div>
</template>
