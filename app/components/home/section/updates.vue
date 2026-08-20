<script setup lang="ts">
import { getListUpdate } from "~/services/update"

const { run } = getListUpdate({ query: { size: 6 } })
const { data, status } = run()

const updates = computed(() => data.value?.data ?? [])
</script>

<template>
  <section v-if="status === 'pending' || updates.length" class="pt-7">
    <HomeSectionHeader title="Kabar terbaru" />

    <div v-if="status === 'pending'" class="rail">
      <div
        v-for="n in 2"
        :key="n"
        class="w-[80vw] max-w-[340px] shrink-0 overflow-hidden rounded-2xl border border-default"
      >
        <USkeleton class="h-40 w-full rounded-none" />
        <div class="p-4">
          <USkeleton class="h-3 w-24" />
          <USkeleton class="mt-3 h-5 w-4/5" />
          <USkeleton class="mt-3 h-3 w-full" />
          <USkeleton class="mt-2 h-3 w-2/3" />
        </div>
      </div>
    </div>

    <ul v-else class="rail">
      <li
        v-for="update in updates"
        :key="update.id"
        class="w-[80vw] max-w-[340px] shrink-0 snap-start"
      >
        <component
          :is="update.campaign ? 'NuxtLink' : 'article'"
          :to="update.campaign ? `/donasi/${update.campaign.slug}` : undefined"
          class="group flex h-full flex-col overflow-hidden rounded-2xl border border-default bg-default transition-shadow duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <div class="h-40 shrink-0 bg-muted">
            <CampaignCover
              :attachment="update.campaign?.cover ?? null"
              :title="update.campaign?.title ?? update.title"
            />
          </div>

          <div class="flex flex-1 flex-col p-4">
            <time class="text-xs text-muted" :datetime="update.createdAt">
              {{ formatRelativeTime(update.createdAt) }}
            </time>
            <h3
              class="mt-1.5 line-clamp-2 leading-snug font-semibold text-highlighted transition-colors group-hover:text-primary"
            >
              {{ update.title }}
            </h3>
            <!-- A three-line clamp is no place for headings and bullets. -->
            <p class="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
              {{ stripMarkdown(update.description) }}
            </p>

            <div v-if="update.campaign" class="mt-auto pt-4">
              <div class="mb-1.5 flex items-center justify-between text-xs text-muted">
                <span class="line-clamp-1">{{ update.campaign.title }}</span>
                <span class="numeric font-semibold text-toned">
                  {{ update.campaign.progress }}%
                </span>
              </div>
              <UProgress
                :model-value="update.campaign.progress"
                color="primary"
                size="sm"
                :aria-label="`${update.campaign.progress} persen dari target`"
              />
            </div>
          </div>
        </component>
      </li>
    </ul>
  </section>
</template>
