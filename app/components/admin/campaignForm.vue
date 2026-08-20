<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { AdminCampaignInput } from "~~/shared/validation/admin"

import { adminCampaignSchema } from "~~/shared/validation/admin"

import { categories } from "~/constants/category"
import { campaignStatusOptions } from "~/constants/status"
import { getListAdminFundraiser } from "~/services/admin/content"

/**
 * Shared by the create and edit pages. It owns the field layout only — the
 * parent owns the mutation, so both screens submit through their own service.
 *
 * The layout answers one question per section, in the order the work happens:
 * what the program is called, what it says, what it looks like, and only then
 * where and when it runs. The old form put all of those in one undifferentiated
 * column of fields, which is why it read as a wall.
 */
const props = defineProps<{
  submitLabel: string
  pending?: boolean
  /** Prefills the form; the edit page passes the loaded campaign. */
  initial?: AdminCampaignDetail | null
}>()

const emit = defineEmits<{ submit: [AdminCampaignBody] }>()

const state = reactive<AdminCampaignInput>({
  title: "",
  slug: "",
  category: "social",
  excerpt: "",
  description: "",
  location: "",
  mapsUrl: "",
  targetAmount: 1_000_000,
  status: "draft",
  endAt: null,
  fundraiserId: null,
  images: [],
})

/** `datetime-local` cannot take an ISO string with a zone, so trim to minutes. */
const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : "")

const endAtInput = ref("")
const imageInput = ref("")

watchEffect(() => {
  const campaign = props.initial
  if (!campaign) return

  state.title = campaign.title
  state.slug = campaign.slug
  state.category = campaign.category
  state.excerpt = campaign.excerpt
  state.description = campaign.description
  state.location = campaign.location ?? ""
  state.mapsUrl = campaign.mapsUrl ?? ""
  state.targetAmount = campaign.targetAmount
  state.status = campaign.status
  state.fundraiserId = campaign.fundraiser?.id ?? null
  state.images = campaign.media.map((item) => item.url)

  endAtInput.value = toDateInput(campaign.endAt)
})

const { run: runFundraisers } = getListAdminFundraiser()
const { data: fundraiserData } = runFundraisers()

const fundraiserItems = computed(() => [
  { label: "Tanpa lembaga", value: null as string | null },
  ...(fundraiserData.value?.data ?? []).map((item) => ({
    label: item.name,
    value: item.id as string | null,
  })),
])

const categoryItems = categories.map((item) => ({ label: item.name, value: item.key }))

const addImage = () => {
  const url = imageInput.value.trim()
  if (!url || state.images?.includes(url)) return

  state.images = [...(state.images ?? []), url]
  imageInput.value = ""
}

const removeImage = (url: string) => {
  state.images = (state.images ?? []).filter((item) => item !== url)
}

/** The excerpt is the one line that has to fit on a card, so its budget is shown. */
const EXCERPT_LIMIT = 160

const onSubmit = (event: FormSubmitEvent<AdminCampaignInput>) => {
  emit("submit", {
    ...event.data,
    // An empty date field means "no deadline", not "1970".
    endAt: endAtInput.value ? new Date(endAtInput.value).toISOString() : null,
  })
}
</script>

<template>
  <!--
    The negative bottom margin cancels the dashboard panel's own bottom padding,
    which is what lets `<AdminFormActions>` sit flush against the bottom edge
    instead of stopping a gutter short of it. See that component for why.
  -->
  <UForm
    id="admin-campaign-form"
    :schema="adminCampaignSchema"
    :state="state"
    class="-mb-5 sm:-mb-7"
    @submit="onSubmit"
  >
    <div class="grid items-start gap-6 xl:grid-cols-3">
      <div class="space-y-6 xl:col-span-2">
        <UCard>
          <template #header>
            <div>
              <h3 class="text-lg font-semibold text-highlighted">Identitas program</h3>
              <p class="mt-1 text-sm text-muted">
                Nama yang dibaca donatur, dan alamat halamannya di situs publik.
              </p>
            </div>
          </template>

          <div class="space-y-6">
            <UFormField name="title" label="Judul campaign" required>
              <UInput
                v-model="state.title"
                placeholder="Sumur Bor untuk Desa Kekeringan"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="slug"
              label="Slug"
              help="Bagian akhir URL publik. Kosongkan agar dibuat otomatis dari judul."
            >
              <UInput
                v-model="state.slug"
                placeholder="sumur-bor-untuk-desa-kekeringan"
                class="w-full font-mono"
              >
                <!-- Shown as a prefix so the slug reads as the URL it becomes. -->
                <template #leading>
                  <span class="text-sm text-dimmed">/donasi/</span>
                </template>
              </UInput>
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div>
              <h3 class="text-lg font-semibold text-highlighted">Cerita program</h3>
              <p class="mt-1 text-sm text-muted">
                Satu kalimat untuk kartu campaign, lalu keterangan lengkapnya.
              </p>
            </div>
          </template>

          <div class="space-y-6">
            <UFormField
              name="excerpt"
              label="Ringkasan"
              required
              help="Satu kalimat yang tampil pada kartu campaign dan hasil pencarian."
            >
              <UTextarea
                v-model="state.excerpt"
                :rows="2"
                :maxlength="EXCERPT_LIMIT"
                placeholder="Bantu sediakan air bersih bagi warga desa yang dilanda kekeringan."
                class="w-full"
                :ui="{ base: 'resize-none' }"
              />
              <template #hint>
                <span class="numeric text-xs text-dimmed">
                  {{ state.excerpt.length }}/{{ EXCERPT_LIMIT }}
                </span>
              </template>
            </UFormField>

            <UFormField
              name="description"
              label="Deskripsi lengkap"
              required
              help="Disimpan sebagai Markdown dan ditampilkan apa adanya pada tab Deskripsi halaman publik."
            >
              <AdminMarkdownEditor
                v-model="state.description"
                placeholder="Jelaskan kondisi lapangan, rencana penggunaan dana, dan penerima manfaat."
              />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div>
              <h3 class="text-lg font-semibold text-highlighted">Dokumentasi</h3>
              <p class="mt-1 text-sm text-muted">
                Tempelkan URL gambar. Gambar pertama dipakai sebagai sampul.
              </p>
            </div>
          </template>

          <div class="flex flex-col gap-2.5 sm:flex-row">
            <UInput
              v-model="imageInput"
              placeholder="https://..."
              class="flex-1"
              @keydown.enter.prevent="addImage"
            />
            <UButton
              icon="i-material-symbols-add-rounded"
              label="Tambah gambar"
              color="neutral"
              variant="outline"
              class="shrink-0 justify-center"
              @click="addImage"
            />
          </div>

          <!--
            A grid of thumbnails rather than a list of URLs: the point of this
            section is what the artwork looks like, and the first tile is the
            cover, which the badge says out loud.
          -->
          <ul
            v-if="state.images?.length"
            class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <li
              v-for="(url, index) in state.images"
              :key="url"
              class="group relative overflow-hidden rounded-xl border border-default"
            >
              <NuxtImg
                :src="url"
                alt=""
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

              <UButton
                icon="i-material-symbols-delete-outline-rounded"
                color="error"
                variant="solid"
                size="sm"
                class="absolute end-2 top-2"
                :aria-label="`Hapus gambar ${index + 1}`"
                @click="removeImage(url)"
              />

              <p class="truncate px-3 py-2 text-xs text-dimmed">{{ url }}</p>
            </li>
          </ul>

          <div
            v-else
            class="mt-5 rounded-xl border border-dashed border-default py-10 text-center"
          >
            <UIcon
              name="i-material-symbols-image-outline-rounded"
              class="size-9 text-dimmed"
            />
            <p class="mt-2 text-sm text-muted">Belum ada gambar ditambahkan.</p>
          </div>
        </UCard>
      </div>

      <!-- The settings rail: everything that decides where and when, not what. -->
      <div class="space-y-6 xl:sticky xl:top-4">
        <UCard>
          <template #header>
            <div>
              <h3 class="text-lg font-semibold text-highlighted">Publikasi</h3>
              <p class="mt-1 text-sm text-muted">
                Draf tidak tampil di situs publik sampai statusnya aktif.
              </p>
            </div>
          </template>

          <div class="space-y-6">
            <UFormField name="status" label="Status" required>
              <USelectMenu
                v-model="state.status"
                :items="campaignStatusOptions"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <UFormField name="category" label="Kategori" required>
              <USelectMenu
                v-model="state.category"
                :items="categoryItems"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="fundraiserId"
              label="Lembaga penggalang"
              help="Tampil pada kartu penggalang dana di halaman publik."
            >
              <USelectMenu
                v-model="state.fundraiserId"
                :items="fundraiserItems"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="endAt"
              label="Batas waktu"
              help="Kosongkan untuk campaign tanpa tenggat."
            >
              <UInput v-model="endAtInput" type="date" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div>
              <h3 class="text-lg font-semibold text-highlighted">Target dan lokasi</h3>
              <p class="mt-1 text-sm text-muted">
                Angka yang mengisi bilah perolehan, dan titik yang dipetakan.
              </p>
            </div>
          </template>

          <div class="space-y-6">
            <UFormField name="targetAmount" label="Target donasi" required>
              <UInputNumber
                v-model="state.targetAmount"
                :min="100000"
                :step="500000"
                :format-options="{
                  style: 'currency',
                  currency: 'IDR',
                  currencyDisplay: 'symbol',
                  maximumFractionDigits: 0,
                }"
                locale="id-ID"
                class="w-full"
              />
            </UFormField>

            <UFormField name="location" label="Lokasi">
              <UInput
                v-model="state.location"
                placeholder="Gunung Kidul, Yogyakarta"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="mapsUrl"
              label="Tautan Google Maps"
              help="Tautan dari tombol Bagikan di Google Maps. Petanya ikut tampil di halaman publik."
            >
              <UInput
                v-model="state.mapsUrl"
                placeholder="https://maps.google.com/?q=..."
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>
      </div>
    </div>

    <AdminFormActions hint="Perubahan baru tersimpan setelah tombol ini ditekan.">
      <UButton
        type="submit"
        form="admin-campaign-form"
        :label="submitLabel"
        icon="i-material-symbols-save-rounded"
        color="primary"
        size="xl"
        class="justify-center"
        :loading="pending"
        :loading-auto="false"
      />
    </AdminFormActions>
  </UForm>
</template>
