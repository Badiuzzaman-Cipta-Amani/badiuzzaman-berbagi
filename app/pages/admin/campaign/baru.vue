<script setup lang="ts">
import { postAdminCampaign } from "~/services/admin/campaign"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const toast = useToast()

const { body, run } = postAdminCampaign()
const { execute, pending } = run()

const onSubmit = async (payload: AdminCampaignBody) => {
  body.value = payload

  try {
    const response = await execute()
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
    await navigateTo(`/admin/campaign/${response.data.id}`)
  } catch (error) {
    toast.add({
      title: "Campaign gagal dibuat",
      description:
        (error as { statusMessage?: string })?.statusMessage ?? "Periksa kembali isian.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

useSeoMeta({ title: "Campaign Baru", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Campaign baru"
      description="Simpan sebagai draf dulu bila detailnya belum final."
      back-to="/admin/campaign"
      back-label="Kembali ke daftar campaign"
    />

    <AdminCampaignForm
      submit-label="Simpan campaign"
      :pending="pending"
      @submit="onSubmit"
    />
  </div>
</template>
