<script setup lang="ts">
definePageMeta({
  layout: "default",
})

usePageSeo({
  title: "Beranda",
  description:
    "Badiuzzaman Berbagi adalah platform donasi terpercaya untuk menyalurkan zakat, infaq, sedekah, dan bantuan sosial secara transparan dan amanah.",
  type: "website",
})
</script>

<template>
  <main class="pb-28">
    <HomeSectionHero />
    <HomeSectionUrgentCampaign />
    <HomeSectionCategory />
    <HomeSectionCampaigns />
    <HomeSectionUpdates />
    <HomeSectionDuas />
    <HomePresentedBySection />
    <HomeFooterSection />
  </main>
</template>
