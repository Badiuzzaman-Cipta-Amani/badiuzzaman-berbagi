<script setup lang="ts">
import { donationStatusOptions } from "~/constants/status"
import { getPaginateMyDonation } from "~/services/donation"

definePageMeta({
  layout: "detail",
  middleware: "auth",
})

const { query, run } = getPaginateMyDonation({ query: { size: 10 } })
const { data, status, error, refresh } = run()

const donations = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta)

// A "muat lebih banyak" refetch must not blank the list already on screen.
const pending = computed(() => status.value === "pending")
const firstLoad = computed(() => pending.value && !donations.value.length)

const filters = [{ label: "Semua", value: "" }, ...donationStatusOptions]

const setStatus = (value: DonationStatus | "") => {
  query.value.status = value
  query.value.page = 1
}

usePageSeo({
  title: "Riwayat Donasi",
  description: "Status setiap donasi yang pernah Anda kirim melalui Badiuzzaman Berbagi.",
  type: "website",
})
</script>

<template>
  <main class="pb-28">
    <LayoutBackHeader title="Riwayat donasi" fallback="/akun" />

    <div class="px-gutter pt-5">
      <!-- Chips rather than a select: four options fit, and a tap beats two. -->
      <div class="-mx-gutter hide-scrollbar flex gap-2 overflow-x-auto px-gutter pb-1">
        <UButton
          v-for="filter in filters"
          :key="filter.value"
          :label="filter.label"
          :color="(query.status ?? '') === filter.value ? 'primary' : 'neutral'"
          :variant="(query.status ?? '') === filter.value ? 'subtle' : 'outline'"
          size="sm"
          class="shrink-0"
          :aria-pressed="(query.status ?? '') === filter.value"
          @click="setStatus(filter.value as DonationStatus | '')"
        />
      </div>

      <div v-if="firstLoad" class="mt-5 space-y-3">
        <USkeleton v-for="n in 3" :key="n" class="h-48 w-full rounded-2xl" />
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        variant="subtle"
        icon="i-material-symbols-cloud-off-rounded"
        title="Gagal memuat riwayat"
        description="Periksa koneksi Anda, lalu coba lagi."
        class="mt-5"
        :actions="[
          {
            label: 'Coba lagi',
            color: 'error',
            variant: 'solid',
            onClick: () => refresh(),
          },
        ]"
      />

      <UEmpty
        v-else-if="!donations.length"
        icon="i-material-symbols-receipt-long-rounded"
        title="Belum ada donasi"
        :description="
          query.status
            ? 'Tidak ada donasi dengan status ini.'
            : 'Donasi yang Anda kirim akan tampil di sini beserta statusnya.'
        "
        :actions="[{ label: 'Lihat program', color: 'primary', to: '/donasi' }]"
        class="mt-10"
      />

      <template v-else>
        <ul class="mt-5 space-y-4">
          <li v-for="donation in donations" :key="donation.reference">
            <DonationReceiptCard :donation="donation" compact />

            <!--
              A pending donation is the one the donor still has something to do
              about, so the way to do it sits on the card rather than a page away.
            -->
            <UButton
              v-if="donation.status === 'pending'"
              :to="`/lacak-donasi/${donation.reference}`"
              :label="
                donation.confirmedAt ? 'Lihat status konfirmasi' : 'Kirim bukti transfer'
              "
              :icon="
                donation.confirmedAt
                  ? 'i-material-symbols-hourglass-top-rounded'
                  : 'i-material-symbols-upload-rounded'
              "
              color="primary"
              :variant="donation.confirmedAt ? 'outline' : 'solid'"
              size="lg"
              block
              class="mt-2"
            />
          </li>
        </ul>

        <!--
          Paged rather than "muat lebih banyak": `useQuery` replaces `data` on a
          refetch, so an append-style button would swap the list out from under
          the reader instead of growing it.
        -->
        <div v-if="meta && meta.pageCount > 1" class="mt-6 flex justify-center">
          <UPagination
            :page="meta.currentPage"
            :total="meta.totalCount"
            :items-per-page="query.size ?? 10"
            :sibling-count="1"
            size="md"
            @update:page="query.page = $event"
          />
        </div>
      </template>
    </div>
  </main>
</template>
