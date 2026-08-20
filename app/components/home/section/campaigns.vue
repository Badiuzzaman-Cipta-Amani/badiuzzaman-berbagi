<script setup lang="ts">
import { getPaginateCampaign } from "~/services/campaign"

const { run } = getPaginateCampaign({ query: { size: 6 } })
const { data, status } = run()

const campaigns = computed(() => data.value?.data ?? [])
</script>

<template>
  <section class="pt-7">
    <HomeSectionHeader title="Butuh bantuan" to="/donasi" />

    <div v-if="status === 'pending'" class="rail">
      <div v-for="n in 3" :key="n" class="w-60 shrink-0">
        <CampaignCardSkeleton compact />
      </div>
    </div>

    <UEmpty
      v-else-if="!campaigns.length"
      icon="i-material-symbols-inbox-rounded"
      title="Belum ada kampanye aktif"
      description="Program baru akan tampil di sini begitu dibuka."
      class="mx-gutter"
    />

    <ul v-else class="rail">
      <li
        v-for="campaign in campaigns"
        :key="campaign.slug"
        class="w-60 shrink-0 snap-start"
      >
        <CampaignCard :campaign="campaign" compact />
      </li>
    </ul>
  </section>
</template>
