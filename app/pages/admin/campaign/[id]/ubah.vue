<script setup lang="ts">
import { campaignStatuses } from "~/constants/status"
import { getDetailAdminCampaign, putAdminCampaign } from "~/services/admin/campaign"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const route = useRoute()
const toast = useToast()

const id = computed(() => String(route.params.id ?? ""))

const { params: detailParams, run } = getDetailAdminCampaign({ params: { id: id.value } })
const { data, status, error, refresh } = run()

// Moving between two campaigns reuses this component, so the service's params
// have to follow the route or the second one prefills with the first one's data.
watch(id, (value) => (detailParams.value.id = value))

const campaign = computed(() => data.value?.data ?? null)
const loading = computed(() => status.value === "pending")

const { params, body, run: runUpdate } = putAdminCampaign({ params: { id: id.value } })
const { execute, pending } = runUpdate()

const onSubmit = async (payload: AdminCampaignBody) => {
  params.value.id = id.value
  body.value = payload

  try {
    const response = await execute()
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

useSeoMeta({ title: "Ubah Campaign", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      :title="campaign?.title ?? 'Ubah campaign'"
      description="Perubahan langsung berlaku pada halaman publik campaign ini."
      :back-to="`/admin/campaign/${id}`"
      back-label="Kembali ke detail campaign"
    >
      <template #actions>
        <UBadge
          v-if="campaign"
          :label="campaignStatuses[campaign.status].label"
          :color="campaignStatuses[campaign.status].color"
          :icon="campaignStatuses[campaign.status].icon"
          variant="subtle"
        />
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

    <div v-if="loading" class="grid gap-4 lg:grid-cols-3">
      <USkeleton class="h-96 w-full rounded-xl lg:col-span-2" />
      <USkeleton class="h-96 w-full rounded-xl" />
    </div>

    <UAlert
      v-else-if="error || !campaign"
      color="error"
      variant="subtle"
      icon="i-material-symbols-cloud-off-rounded"
      title="Campaign tidak dapat dimuat"
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
      No figures here on purpose: the perolehan, the donor count, and the queue
      belong to the detail page one step back. This screen is only the form.
    -->
    <AdminCampaignForm
      v-else
      :initial="campaign"
      submit-label="Simpan perubahan"
      :pending="pending"
      @submit="onSubmit"
    />
  </div>
</template>
