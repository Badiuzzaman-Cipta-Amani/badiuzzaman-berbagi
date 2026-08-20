<script setup lang="ts">
import { donationStatuses } from "~/constants/status"
import { getDetailAdminDonation } from "~/services/admin/donation"

definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const route = useRoute()
const { can } = useAdminAuth()

const id = computed(() => String(route.params.id ?? ""))

const { params, run } = getDetailAdminDonation({ params: { id: id.value } })
const { data, status, error, refresh } = run()

// Moving between two donations reuses this component, so the service's params
// have to follow the route or the second one renders the first one's data.
watch(id, (value) => (params.value.id = value))

const donation = computed(() => data.value?.data)
const loading = computed(() => status.value === "pending")

const canVerify = computed(() => can("donation.verify"))

const decisionOpen = ref(false)
const decision = ref<"verified" | "rejected">("verified")

const openDecision = (next: "verified" | "rejected") => {
  decision.value = next
  decisionOpen.value = true
}

useSeoMeta({ title: "Detail Donasi", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      title="Detail donasi"
      description="Periksa data donatur sebelum mengubah status verifikasi."
      back-to="/admin/donasi"
      back-label="Kembali ke daftar donasi"
    />

    <div v-if="loading" class="grid gap-4 lg:grid-cols-3">
      <USkeleton class="h-72 w-full rounded-xl lg:col-span-2" />
      <USkeleton class="h-72 w-full rounded-xl" />
    </div>

    <UAlert
      v-else-if="error || !donation"
      color="error"
      variant="subtle"
      icon="i-material-symbols-cloud-off-rounded"
      title="Donasi tidak dapat dimuat"
      description="Data mungkin sudah dihapus, atau koneksi Anda terputus."
      :actions="[
        {
          label: 'Coba lagi',
          color: 'error',
          variant: 'solid',
          onClick: () => refresh(),
        },
      ]"
    />

    <div v-else class="grid gap-5 lg:grid-cols-3">
      <div class="space-y-5 lg:col-span-2">
        <UCard>
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-lg font-semibold text-highlighted">Informasi donasi</h3>
              <UBadge
                :label="donationStatuses[donation.status].label"
                :color="donationStatuses[donation.status].color"
                :icon="donationStatuses[donation.status].icon"
                variant="subtle"
              />
            </div>
          </template>

          <dl class="grid gap-5 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-muted">Nominal</dt>
              <dd class="mt-0.5 numeric text-2xl font-bold text-highlighted">
                {{ formatCurrency(donation.amount) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Kode donasi</dt>
              <dd class="mt-0.5 numeric font-semibold tracking-wide text-toned">
                {{ donation.reference }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Nama donatur</dt>
              <dd class="mt-0.5 font-medium text-toned">
                <ol
                  v-if="donation.donorNames.length > 1"
                  class="list-inside list-decimal space-y-0.5"
                >
                  <li v-for="(name, index) in donation.donorNames" :key="index">
                    {{ name }}
                  </li>
                </ol>
                <template v-else>{{ donation.donorName }}</template>
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Akun terdaftar</dt>
              <dd class="mt-0.5 text-toned">
                <NuxtLink
                  v-if="donation.user"
                  :to="`/admin/donatur/${donation.user.id}`"
                  class="font-medium text-primary-700 hover:underline"
                >
                  {{ donation.user.name }} · {{ donation.user.email }}
                </NuxtLink>
                <span v-else class="text-dimmed">Donasi tanpa akun</span>
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Waktu masuk</dt>
              <dd class="mt-0.5 text-toned">{{ formatDate(donation.createdAt) }}</dd>
            </div>
          </dl>

          <div class="mt-6 rounded-xl bg-muted p-4">
            <p class="text-sm font-medium text-muted">Doa donatur</p>
            <p v-if="donation.message" class="mt-1 text-toned italic">
              “{{ donation.message }}”
            </p>
            <p v-else class="mt-1 text-sm text-dimmed">
              Donatur tidak meninggalkan pesan.
            </p>
          </div>
        </UCard>

        <!--
          The donor's half of verification. This is what the decision is actually
          made against: without proof on the screen, "verifikasi" is a guess.
        -->
        <UCard>
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-lg font-semibold text-highlighted">Bukti pembayaran</h3>
              <UBadge
                :label="donation.confirmedAt ? 'Sudah dikirim donatur' : 'Belum dikirim'"
                :color="donation.confirmedAt ? 'info' : 'neutral'"
                :icon="
                  donation.confirmedAt
                    ? 'i-material-symbols-attach-file-rounded'
                    : 'i-material-symbols-hourglass-empty-rounded'
                "
                variant="subtle"
              />
            </div>
          </template>

          <template v-if="donation.confirmedAt">
            <p class="text-sm text-muted">
              Dikirim {{ formatRelativeTime(donation.confirmedAt) }} ·
              {{ formatDate(donation.confirmedAt) }}
            </p>

            <UButton
              v-if="donation.proofUrl"
              :to="donation.proofUrl"
              target="_blank"
              rel="noopener noreferrer"
              label="Buka bukti transfer"
              icon="i-material-symbols-receipt-rounded"
              trailing-icon="i-material-symbols-open-in-new-rounded"
              color="primary"
              variant="subtle"
              size="md"
              class="mt-3"
            />

            <p v-if="donation.proofNote" class="mt-4 text-toned">
              {{ donation.proofNote }}
            </p>
          </template>

          <p v-else class="text-sm text-muted">
            Donatur belum mengunggah bukti transfer. Cocokkan langsung dengan mutasi
            rekening bila dana sudah masuk.
          </p>
        </UCard>

        <UCard v-if="donation.campaign">
          <template #header>
            <h3 class="text-lg font-semibold text-highlighted">Campaign tujuan</h3>
          </template>

          <p class="font-semibold text-highlighted">{{ donation.campaign.title }}</p>
          <UProgress
            :model-value="donation.campaign.progress"
            size="md"
            color="primary"
            class="mt-3"
          />
          <p class="mt-2 numeric text-sm text-muted">
            {{ formatCurrency(donation.campaign.raisedAmount) }} terkumpul dari
            {{ formatCurrency(donation.campaign.targetAmount) }}
          </p>

          <template #footer>
            <div class="flex flex-wrap gap-2">
              <UButton
                :to="`/admin/campaign/${donation.campaign.id}`"
                icon="i-material-symbols-mosque-rounded"
                label="Detail campaign"
                color="primary"
                variant="subtle"
                size="md"
              />
              <UButton
                :to="`/donasi/${donation.campaign.slug}`"
                target="_blank"
                icon="i-material-symbols-open-in-new-rounded"
                label="Lihat halaman publik"
                color="neutral"
                variant="outline"
                size="md"
              />
              <UButton
                :to="`/admin/donasi?campaign=${donation.campaign.slug}`"
                icon="i-material-symbols-filter-list-rounded"
                label="Semua donasi campaign ini"
                color="neutral"
                variant="ghost"
                size="md"
              />
            </div>
          </template>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-highlighted">Verifikasi</h3>
        </template>

        <div class="space-y-4">
          <div>
            <p class="text-sm text-muted">Diproses oleh</p>
            <p class="mt-0.5 font-medium text-toned">
              {{ donation.verifiedBy?.name ?? "Belum diproses" }}
            </p>
          </div>

          <div v-if="donation.verifiedAt">
            <p class="text-sm text-muted">Diverifikasi pada</p>
            <p class="mt-0.5 text-toned">{{ formatDate(donation.verifiedAt) }}</p>
          </div>

          <div v-if="donation.reviewNote">
            <p class="text-sm text-muted">Catatan</p>
            <p class="mt-0.5 text-toned">{{ donation.reviewNote }}</p>
          </div>

          <UAlert
            v-if="donation.status === 'pending'"
            color="warning"
            variant="subtle"
            icon="i-material-symbols-hourglass-top-rounded"
            title="Menunggu keputusan"
            description="Cocokkan nominal dengan mutasi rekening sebelum memverifikasi."
          />

          <UAlert
            v-else-if="!canVerify"
            color="neutral"
            variant="subtle"
            icon="i-material-symbols-lock-person-rounded"
            title="Hanya dapat dilihat"
            description="Peran Anda tidak memiliki izin untuk mengubah status donasi."
          />
        </div>

        <template v-if="canVerify" #footer>
          <div class="space-y-2">
            <UButton
              icon="i-material-symbols-verified-rounded"
              label="Verifikasi donasi"
              color="success"
              size="lg"
              block
              :disabled="donation.status === 'verified'"
              @click="openDecision('verified')"
            />
            <UButton
              icon="i-material-symbols-block-rounded"
              label="Tolak donasi"
              color="error"
              variant="outline"
              size="lg"
              block
              :disabled="donation.status === 'rejected'"
              @click="openDecision('rejected')"
            />
          </div>
        </template>
      </UCard>
    </div>

    <AdminDonationDecisionModal
      v-model:open="decisionOpen"
      :donation="donation ?? null"
      :decision="decision"
      @done="refresh()"
    />
  </div>
</template>
