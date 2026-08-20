<script setup lang="ts">
import {
  getDetailAdminUpdateCampaign,
  postAdminCampaignUpdate,
} from "~/services/admin/content"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const route = useRoute()
const toast = useToast()

const id = computed(() => String(route.params.id ?? ""))

const { run: runCampaign } = getDetailAdminUpdateCampaign({ params: { id: id.value } })
const { data: campaignData } = runCampaign()

const campaign = computed(() => campaignData.value?.data ?? null)

const { body, run } = postAdminCampaignUpdate()
const { execute: create, pending } = run()

const onSubmit = async (payload: AdminCampaignUpdateBody) => {
  body.value = payload

  try {
    const response = await create()
    toast.add({
      title: response.message,
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
    // Land on the edit page for what was just written, so a typo is one click away.
    await navigateTo(`/admin/kabar/${id.value}/${response.data.id}`)
  } catch (error) {
    toast.add({
      title: "Kabar gagal disimpan",
      description:
        (error as { statusMessage?: string })?.statusMessage ?? "Periksa kembali isian.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

useSeoMeta({ title: "Tulis Kabar", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Tulis kabar"
      description="Kabar langsung tampil pada tab Kabar di halaman publik campaign ini."
      :back-to="`/admin/kabar/${id}`"
      back-label="Kembali ke daftar kabar"
    />

    <AdminUpdateForm
      :campaign-id="id"
      :campaign-title="campaign?.title ?? '—'"
      :cancel-to="`/admin/kabar/${id}`"
      submit-label="Publikasikan"
      :pending="pending"
      @submit="onSubmit"
    />
  </div>
</template>
