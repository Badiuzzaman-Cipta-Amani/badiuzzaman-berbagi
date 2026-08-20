<script setup lang="ts">
import { site } from "~/constants/site"

const values = [
  {
    title: "Amanah",
    description:
      "Menjaga kepercayaan donatur dengan bertanggung jawab atas setiap dana yang masuk.",
    icon: "i-material-symbols-handshake-rounded",
  },
  {
    title: "Transparan",
    description: "Laporan terbuka dan dapat diakses kapan saja oleh publik.",
    icon: "i-material-symbols-visibility-rounded",
  },
  {
    title: "Tepat sasaran",
    description: "Memastikan bantuan sampai kepada mereka yang berhak menerima.",
    icon: "i-material-symbols-target-rounded",
  },
  {
    title: "Profesional",
    description: "Dikelola oleh tim yang berpengalaman dan berkompeten.",
    icon: "i-material-symbols-workspace-premium-rounded",
  },
]

const misi = [
  "Menyalurkan donasi dengan cepat dan tepat sasaran",
  "Menjaga transparansi dalam setiap program",
  "Memberdayakan masyarakat melalui edukasi",
  "Membangun jaringan relawan yang kuat",
]

const contacts = [
  { ...site.phone, icon: "i-material-symbols-call-rounded", external: false },
  { ...site.email, icon: "i-material-symbols-mail-rounded", external: false },
  { ...site.whatsapp, icon: "i-simple-icons-whatsapp", external: true },
]

usePageSeo({
  title: "Tentang Kami",
  description: `Mengenal ${site.foundation}, lembaga donasi terpercaya sejak ${site.foundedYear} dengan prinsip transparansi dan amanah.`,
  type: "website",
})
</script>

<template>
  <main class="pb-28">
    <section
      class="relative overflow-hidden bg-primary-900 px-gutter pt-10 pb-9 text-center"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-radial-[at_50%_0%] from-primary-700/60 to-transparent to-70%"
        aria-hidden="true"
      />
      <div class="relative">
        <span
          class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-100/10 ring-1 ring-primary-100/15"
        >
          <UIcon name="i-material-symbols-mosque-rounded" class="size-7 text-white" />
        </span>
        <h1
          class="mt-5 text-2xl leading-tight font-extrabold tracking-tight text-balance text-white"
        >
          {{ site.foundation }}
        </h1>
        <p class="mt-2 text-sm text-primary-200">
          Menyalurkan donasi sejak <span class="numeric">{{ site.foundedYear }}</span>
        </p>
      </div>
    </section>

    <div class="space-y-9 px-gutter pt-8">
      <section>
        <p class="text-sm leading-relaxed text-toned">
          Kami adalah lembaga nirlaba yang berdedikasi untuk menyalurkan bantuan
          masyarakat dengan prinsip
          <strong class="font-semibold text-highlighted"
            >transparansi, amanah, dan profesionalisme</strong
          >. Berawal dari sebuah komunitas kecil di Jakarta, kini kami menjangkau puluhan
          desa di seluruh Indonesia.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-bold tracking-tight text-highlighted">Visi</h2>
        <p class="mt-2 text-sm leading-relaxed text-toned">
          Menjadi lembaga donasi terpercaya yang menjadi jembatan kebaikan antara donatur
          dan mereka yang membutuhkan di seluruh Indonesia.
        </p>

        <h2 class="mt-6 text-lg font-bold tracking-tight text-highlighted">Misi</h2>
        <ol class="mt-2 space-y-2 text-sm leading-relaxed text-toned">
          <li v-for="(item, index) in misi" :key="item" class="flex gap-3">
            <span class="shrink-0 numeric font-semibold text-primary">
              {{ index + 1 }}.
            </span>
            <span>{{ item }}</span>
          </li>
        </ol>
      </section>

      <section>
        <h2 class="text-lg font-bold tracking-tight text-highlighted">Nilai kami</h2>
        <dl class="mt-2 divide-y divide-default">
          <div v-for="value in values" :key="value.title" class="flex gap-3.5 py-4">
            <UIcon :name="value.icon" class="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <dt class="text-sm font-semibold text-highlighted">{{ value.title }}</dt>
              <dd class="mt-1 text-sm leading-relaxed text-muted">
                {{ value.description }}
              </dd>
            </div>
          </div>
        </dl>
      </section>

      <AboutDocumentationGallery />

      <section>
        <h2 class="text-lg font-bold tracking-tight text-highlighted">Legalitas</h2>
        <dl class="mt-3 divide-y divide-default rounded-2xl border border-default">
          <div
            v-for="item in site.legal"
            :key="item.label"
            class="flex items-baseline justify-between gap-4 px-4 py-3"
          >
            <dt class="text-sm text-muted">{{ item.label }}</dt>
            <dd class="text-right numeric text-sm font-medium text-toned">
              {{ item.value }}
            </dd>
          </div>
        </dl>
      </section>

      <section class="rounded-2xl bg-primary-900 p-6">
        <h2 class="text-lg font-bold tracking-tight text-white">Hubungi kami</h2>
        <p class="mt-1.5 text-sm text-primary-200">
          Punya pertanyaan atau ingin bekerja sama?
        </p>
        <div class="mt-5 space-y-2">
          <UButton
            v-for="contact in contacts"
            :key="contact.label"
            :to="contact.href"
            :icon="contact.icon"
            :label="contact.label"
            :target="contact.external ? '_blank' : undefined"
            :rel="contact.external ? 'noopener noreferrer' : undefined"
            color="neutral"
            variant="ghost"
            size="lg"
            block
            class="justify-start text-white hover:bg-white/10"
          />
        </div>
        <p class="mt-5 flex items-start gap-2 text-sm leading-relaxed text-primary-200">
          <UIcon
            name="i-material-symbols-location-on-rounded"
            class="mt-0.5 size-4 shrink-0"
          />
          {{ site.address }}
        </p>
      </section>
    </div>
  </main>
</template>
