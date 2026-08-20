<script setup lang="ts">
const { title } = defineProps<{
  title: string
}>()

const emit = defineEmits<{
  donate: []
}>()

const toast = useToast()

const shareText = () => `Mari berdonasi untuk "${title}" bersama Badiuzzaman Berbagi!`

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.add({
      title: "Link disalin",
      icon: "i-material-symbols-check-circle-rounded",
      color: "success",
    })
  } catch {
    toast.add({
      title: "Gagal menyalin link",
      description: "Salin alamat halaman ini dari bilah alamat peramban Anda.",
      icon: "i-material-symbols-error-rounded",
      color: "error",
    })
  }
}

const openShare = (target: "whatsapp" | "facebook" | "telegram") => {
  const url = window.location.href
  const text = shareText()

  const targets = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  }

  window.open(targets[target], "_blank", "noopener")
}

const shareItems = computed(() => [
  [
    {
      label: "WhatsApp",
      icon: "i-simple-icons-whatsapp",
      onSelect: () => openShare("whatsapp"),
    },
    {
      label: "Facebook",
      icon: "i-simple-icons-facebook",
      onSelect: () => openShare("facebook"),
    },
    {
      label: "Telegram",
      icon: "i-simple-icons-telegram",
      onSelect: () => openShare("telegram"),
    },
  ],
  [
    {
      label: "Salin link",
      icon: "i-material-symbols-link-rounded",
      onSelect: copyLink,
    },
  ],
])
</script>

<template>
  <div
    class="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-default bg-default/95 px-gutter pt-3.5 pb-bar backdrop-blur-md"
  >
    <div class="flex gap-2.5">
      <UDropdownMenu :items="shareItems" :content="{ align: 'start', side: 'top' }">
        <UButton
          icon="i-material-symbols-share-rounded"
          label="Bagikan"
          color="neutral"
          variant="outline"
        />
      </UDropdownMenu>

      <UButton
        label="Donasi sekarang"
        icon="i-material-symbols-volunteer-activism-rounded"
        color="primary"
        block
        class="flex-1"
        @click="emit('donate')"
      />
    </div>
  </div>
</template>
