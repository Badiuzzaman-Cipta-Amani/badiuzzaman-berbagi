<script setup lang="ts">
import { activeSocials, site } from "~/constants/site"

const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-8 px-gutter pb-8">
    <div class="border-t border-default pt-7 text-center">
      <div class="flex items-center justify-center gap-2">
        <span
          class="flex size-8 items-center justify-center rounded-lg bg-primary text-white"
        >
          <UIcon name="i-material-symbols-volunteer-activism-rounded" class="size-4.5" />
        </span>
        <span class="font-semibold tracking-tight text-highlighted">{{ site.name }}</span>
      </div>
      <p class="mt-2 text-sm text-muted">{{ site.tagline }}</p>

      <div v-if="activeSocials.length" class="mt-5 flex justify-center gap-1">
        <UButton
          v-for="social in activeSocials"
          :key="social.label"
          :to="social.href"
          :icon="social.icon"
          :aria-label="social.label"
          target="_blank"
          rel="noopener noreferrer"
          color="neutral"
          variant="ghost"
        />
      </div>

      <p class="mt-6 text-xs leading-relaxed text-balance text-dimmed">
        © <span class="numeric">{{ year }}</span> {{ site.foundation }}. Hak cipta
        dilindungi.
      </p>
    </div>
  </footer>
</template>
