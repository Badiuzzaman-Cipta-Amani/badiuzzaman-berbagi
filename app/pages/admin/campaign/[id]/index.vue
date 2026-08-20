<script setup lang="ts">
import { categoryLabel } from "~/constants/category"
import { campaignStatuses } from "~/constants/status"
import { getDetailAdminCampaign } from "~/services/admin/campaign"

/**
 * Reading a campaign, as opposed to editing it. The list used to open straight
 * into the form, which meant the only way to answer "what does this program say
 * and how is it doing" was to look at it through a wall of inputs — and every
 * such look risked leaving an accidental edit behind.
 *
 * So this page owns the facts and the money, and `ubah.vue` owns the form.
 */
definePageMeta({
  layout: "admin",
  middleware: "admin",
})

const route = useRoute()
const { can } = useAdminAuth()

const id = computed(() => String(route.params.id ?? ""))

const { params, run } = getDetailAdminCampaign({ params: { id: id.value } })
const { data, status, error, refresh } = run()

// Moving between two campaigns reuses this component, so the service's params
// have to follow the route or the second one renders the first one's campaign.
watch(id, (value) => (params.value.id = value))

const campaign = computed(() => data.value?.data ?? null)
const loading = computed(() => status.value === "pending")

const canManage = computed(() => can("campaign.manage"))
const canViewDonation = computed(() => can("donation.view"))
const canViewUpdate = computed(() => can("update.view"))

useSeoMeta({ title: "Detail Campaign", robots: "noindex, nofollow" })
</script>

<template>
  <div>
    <AdminPageHeader
      :title="campaign?.title ?? 'Detail campaign'"
      description="Isi program, perolehan dananya, dan donasi yang sudah masuk."
      back-to="/admin/campaign"
      back-label="Kembali ke daftar campaign"
    >
      <template #actions>
        <UBadge
          v-if="campaign"
          :label="campaignStatuses[campaign.status].label"
          :color="campaignStatuses[campaign.status].color"
          :icon="campaignStatuses[campaign.status].icon"
          variant="subtle"
        />
        <UButton
          v-if="campaign"
          :to="`/donasi/${campaign.slug}`"
          target="_blank"
          icon="i-material-symbols-open-in-new-rounded"
          label="Lihat publik"
          color="neutral"
          variant="outline"
          size="md"
        />
        <UButton
          v-if="campaign && canManage"
          :to="`/admin/campaign/${id}/ubah`"
          icon="i-material-symbols-edit-rounded"
          label="Ubah campaign"
          color="primary"
          size="md"
        />
      </template>
    </AdminPageHeader>

    <div v-if="loading" class="space-y-5">
      <div class="grid gap-5 sm:grid-cols-3">
        <USkeleton v-for="n in 3" :key="n" class="h-32 w-full rounded-xl" />
      </div>
      <div class="grid gap-5 lg:grid-cols-3">
        <USkeleton class="h-96 w-full rounded-xl lg:col-span-2" />
        <USkeleton class="h-96 w-full rounded-xl" />
      </div>
    </div>

    <UAlert
      v-else-if="error || !campaign"
      color="error"
      variant="subtle"
      icon="i-material-symbols-cloud-off-rounded"
      title="Campaign tidak dapat dimuat"
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

    <template v-else>
      <!--
        Tinted by meaning, exactly as on the dashboard: emerald is money in,
        amber is work waiting on a decision, navy is the neutral count. A card
        that turns amber is a card with something to do behind it.
      -->
      <div class="grid gap-5 sm:grid-cols-3">
        <AdminStatCard
          label="Dana terkumpul"
          tone="success"
          :value="formatCurrency(campaign.raisedAmount)"
          icon="i-material-symbols-volunteer-activism-rounded"
          :hint="`${campaign.progress}% dari target ${formatCurrencyShort(campaign.targetAmount)}`"
        />
        <AdminStatCard
          label="Total donatur"
          tone="primary"
          :value="formatNumber(campaign.totalDonor)"
          icon="i-material-symbols-diversity-3-rounded"
          hint="donasi terverifikasi"
        />
        <AdminStatCard
          label="Menunggu verifikasi"
          tone="warning"
          :value="formatNumber(campaign.pendingDonation)"
          icon="i-material-symbols-hourglass-top-rounded"
          hint="donasi belum diproses"
          :to="
            canViewDonation
              ? `/admin/donasi?status=pending&campaign=${campaign.slug}`
              : undefined
          "
        />
      </div>

      <div class="mt-5 grid gap-5 lg:grid-cols-3">
        <div class="space-y-5 lg:col-span-2">
          <UCard>
            <template #header>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="text-lg font-semibold text-highlighted">Perolehan</h3>
                <span class="numeric text-sm font-semibold text-toned">
                  {{ campaign.progress }}%
                </span>
              </div>
            </template>

            <UProgress :model-value="campaign.progress" size="lg" color="primary" />
            <p class="mt-3 numeric text-sm text-muted">
              {{ formatCurrency(campaign.raisedAmount) }} terkumpul dari
              {{ formatCurrency(campaign.targetAmount) }}
            </p>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-highlighted">Cerita program</h3>
            </template>

            <!-- The excerpt is what a donor reads on a card, so it is shown apart. -->
            <div class="rounded-xl bg-muted p-4">
              <p class="text-sm font-medium text-muted">Ringkasan</p>
              <p class="mt-1 text-toned">{{ campaign.excerpt }}</p>
            </div>

            <!-- The same sanitized Markdown the public detail tab renders. -->
            <div class="mt-5">
              <BaseMarkdown :source="campaign.description" />
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="text-lg font-semibold text-highlighted">Dokumentasi</h3>
                <span class="text-sm text-muted">
                  {{ formatNumber(campaign.media.length) }} gambar
                </span>
              </div>
            </template>

            <ul v-if="campaign.media.length" class="grid gap-3 sm:grid-cols-3">
              <li
                v-for="(item, index) in campaign.media"
                :key="item.url"
                class="relative overflow-hidden rounded-xl border border-default"
              >
                <NuxtImg
                  :src="item.url"
                  :alt="item.alt || campaign.title"
                  loading="lazy"
                  class="aspect-4/3 w-full object-cover"
                />
                <UBadge
                  v-if="index === 0"
                  label="Sampul"
                  color="primary"
                  variant="solid"
                  size="sm"
                  class="absolute start-2 top-2"
                />
              </li>
            </ul>

            <UEmpty
              v-else
              icon="i-material-symbols-image-outline-rounded"
              title="Belum ada gambar"
              description="Campaign ini tampil tanpa sampul di situs publik."
            />
          </UCard>

          <AdminCampaignDonationList v-if="canViewDonation" :slug="campaign.slug" />
        </div>

        <div class="space-y-5">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-highlighted">Ringkasan</h3>
            </template>

            <span class="block aspect-16/9 overflow-hidden rounded-xl bg-muted">
              <CampaignCover :attachment="campaign.cover" :title="campaign.title" />
            </span>

            <dl class="mt-5 space-y-4">
              <div>
                <dt class="text-sm text-muted">Kategori</dt>
                <dd class="mt-0.5 font-medium text-toned">
                  {{ categoryLabel(campaign.category) }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted">Slug publik</dt>
                <dd class="mt-0.5 font-mono text-sm break-all text-toned">
                  /donasi/{{ campaign.slug }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted">Lembaga penggalang</dt>
                <dd class="mt-0.5 text-toned">
                  {{ campaign.fundraiser?.name ?? "Tanpa lembaga" }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted">Lokasi</dt>
                <dd class="mt-0.5 text-toned">
                  {{ campaign.location || "Belum diisi" }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted">Batas waktu</dt>
                <dd class="mt-0.5 text-toned">
                  {{ campaign.endAt ? formatDate(campaign.endAt) : "Tanpa tenggat" }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted">Dibuat</dt>
                <dd class="mt-0.5 text-toned">{{ formatDate(campaign.createdAt) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted">Verifikasi lembaga</dt>
                <dd class="mt-0.5 text-toned">
                  {{
                    campaign.verifiedAt
                      ? formatDate(campaign.verifiedAt)
                      : "Belum diverifikasi"
                  }}
                </dd>
              </div>
            </dl>

            <template v-if="campaign.mapsUrl" #footer>
              <UButton
                :to="campaign.mapsUrl"
                target="_blank"
                rel="noopener noreferrer"
                label="Buka titik lokasi"
                icon="i-material-symbols-location-on-rounded"
                trailing-icon="i-material-symbols-open-in-new-rounded"
                color="neutral"
                variant="outline"
                size="md"
              />
            </template>
          </UCard>

          <UCard v-if="canManage || canViewUpdate">
            <template #header>
              <h3 class="text-lg font-semibold text-highlighted">Tindakan</h3>
            </template>

            <div class="space-y-2">
              <UButton
                v-if="canManage"
                :to="`/admin/campaign/${id}/ubah`"
                icon="i-material-symbols-edit-rounded"
                label="Ubah campaign"
                color="primary"
                size="lg"
                block
              />
              <UButton
                v-if="canViewUpdate"
                :to="`/admin/kabar/${id}`"
                icon="i-material-symbols-menu-book-rounded"
                label="Kabar campaign ini"
                color="neutral"
                variant="outline"
                size="lg"
                block
              />
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </div>
</template>
