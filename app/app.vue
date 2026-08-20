<script setup lang="ts">
const showCreateModal = useState("showCreateModal", () => false)
const toast = useToast()

/**
 * Resolve the donor session once, at boot. Nothing on the public site is gated
 * on it — the donate drawer only reads it to prefill a name, and `/akun` to
 * decide whether to greet or invite — but those surfaces are reached without
 * ever passing through the `auth` middleware, so no route would otherwise ask.
 *
 * `useAuth` remembers that it has asked, so this costs exactly one request.
 */
const { fetchSession } = useAuth()

onMounted(() => {
  fetchSession()
})

const handleCreateSubmit = () => {
  toast.add({
    title: "Pengajuan terkirim",
    description: "Tim kami akan menghubungi Anda melalui WhatsApp dalam 1x24 jam.",
    icon: "i-material-symbols-check-circle-rounded",
    color: "success",
  })
  showCreateModal.value = false
}
</script>

<template>
  <UApp :toaster="{ position: 'top-center', duration: 4000 }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ModalsCreateDonationModal
      v-model:open="showCreateModal"
      @submit="handleCreateSubmit"
    />
  </UApp>
</template>
