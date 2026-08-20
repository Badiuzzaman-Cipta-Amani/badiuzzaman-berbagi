<script setup lang="ts">
import type { NuxtError } from "#app"

const { error } = defineProps<{
  error: NuxtError
}>()

const isNotFound = computed(() => error?.statusCode === 404)

const description = computed(() =>
  isNotFound.value
    ? "Halaman yang Anda cari sudah dipindahkan atau tidak pernah ada."
    : "Terjadi kesalahan di sisi kami. Coba muat ulang halaman ini beberapa saat lagi.",
)
</script>

<template>
  <div class="min-h-screen bg-muted">
    <div
      class="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-default px-6 text-center sm:shadow-xl"
    >
      <p
        class="numeric text-7xl leading-none font-extrabold tracking-tight text-primary-200"
      >
        {{ error?.statusCode ?? 500 }}
      </p>
      <h1 class="mt-4 text-xl font-bold text-balance text-highlighted">
        {{ isNotFound ? "Halaman tidak ditemukan" : "Ada yang bermasalah" }}
      </h1>
      <p class="mt-2 max-w-[36ch] text-sm leading-relaxed text-muted">
        {{ description }}
      </p>

      <div class="mt-7 flex w-full flex-col gap-2">
        <UButton
          label="Kembali ke beranda"
          icon="i-material-symbols-home-rounded"
          color="primary"
          size="xl"
          block
          @click="clearError({ redirect: '/' })"
        />
        <UButton
          label="Lihat semua program"
          color="neutral"
          variant="ghost"
          block
          @click="clearError({ redirect: '/donasi' })"
        />
      </div>
    </div>
  </div>
</template>
