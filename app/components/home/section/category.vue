<script setup lang="ts">
import { categories } from "~/constants/category"
</script>

<template>
  <section class="px-gutter pt-7">
    <h2 class="mb-4 text-lg leading-tight font-bold tracking-tight text-highlighted">
      Kategori donasi
    </h2>
    <ul class="grid grid-cols-3 gap-2.5">
      <li v-for="category in categories" :key="category.key">
        <NuxtLink
          :to="{ path: '/donasi', query: { kategori: category.key } }"
          class="flex h-full flex-col items-center gap-2 rounded-xl border border-default p-3 transition-colors hover:border-accented hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span
            :class="[
              'flex size-11 items-center justify-center rounded-lg',
              category.tint,
            ]"
          >
            <UIcon :name="category.icon" class="size-5.5" />
          </span>
          <span
            class="text-center text-xs leading-tight font-medium text-balance text-toned"
          >
            {{ category.name }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
