<script setup lang="ts">
import { site } from "~/constants/site"

defineProps<{ collapsed?: boolean }>()
</script>

<template>
  <NuxtLink to="/admin" class="flex min-w-0 items-center gap-2.5">
    <span
      class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-600"
    >
      <UIcon name="i-material-symbols-mosque-rounded" class="size-5 text-white" />
    </span>
    <span v-if="!collapsed" class="min-w-0">
      <span class="block truncate text-sm font-bold text-highlighted">
        {{ site.name }}
      </span>
      <span class="block text-xs text-muted">Panel Admin</span>
    </span>
  </NuxtLink>
</template>
