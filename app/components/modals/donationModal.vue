<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"

import {
  MAX_DONOR_NAMES,
  MIN_DONATION_AMOUNT,
  donateSchema,
} from "~~/shared/validation/donate"

const { campaignTitle, pending = false } = defineProps<{
  campaignTitle: string
  pending?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: DonateCampaign["body"]]
}>()

const open = defineModel<boolean>("open", { default: false })

const QUICK_AMOUNTS = [10_000, 25_000, 50_000, 100_000, 250_000, 500_000]
const ANONYMOUS_NAMES = [
  "Hamba Allah",
  "Sahabat Berbagi",
  "Dermawan",
  "Pejuang Kebaikan",
  "Tangan Penolong",
  "Pelita Harapan",
]

/**
 * Signing in is never required to give — the session is read only to save the
 * donor from retyping what we already know, and the donation is attributed
 * server-side from the same cookie.
 */
const { user, isLoggedIn } = useAuth()

/**
 * A guest who taps "masuk" is mid-donation, so the link has to bring them back
 * to this campaign rather than to `/akun` — otherwise the invitation to sign in
 * costs them the page they were giving on.
 */
const route = useRoute()
const loginLink = computed(() => ({
  path: "/masuk",
  query: { redirect: route.fullPath },
}))

const state = reactive<DonateCampaign["body"]>({
  donorNames: [],
  message: "",
  amount: 0,
})
const isAnonymous = ref(false)
const anonymousName = ref(ANONYMOUS_NAMES[0]!)

/**
 * One donation can be given on behalf of several people — a family, a patungan
 * — and the certificate has to name all of them, so the field is a roster
 * rather than a single input. Hiding the name replaces the whole roster with
 * one alias, because we print exactly what we show.
 */
const realNames = ref<string[]>([user.value?.name ?? ""])

watchEffect(() => {
  state.donorNames = isAnonymous.value ? [anonymousName.value] : [...realNames.value]
})

// Signing in while the drawer is closed should still prefill it next time.
watch(user, (value) => {
  if (value && !realNames.value[0]) realNames.value[0] = value.name
})

const reset = () => {
  state.amount = 0
  state.message = ""
  realNames.value = [user.value?.name ?? ""]
  isAnonymous.value = false
  anonymousName.value = ANONYMOUS_NAMES[0]!
}

const addName = () => {
  if (realNames.value.length < MAX_DONOR_NAMES) realNames.value.push("")
}

const removeName = (index: number) => {
  realNames.value.splice(index, 1)
}

const randomizeName = () => {
  const pool = ANONYMOUS_NAMES.filter((name) => name !== anonymousName.value)
  anonymousName.value = pool[Math.floor(Math.random() * pool.length)]!
}

const onSubmit = (event: FormSubmitEvent<DonateCampaign["body"]>) => {
  emit("submit", event.data)
}

watch(open, (isOpen) => {
  if (!isOpen) reset()
})
</script>

<template>
  <UDrawer
    v-model:open="open"
    title="Pilih nominal"
    :description="`Donasi untuk ${campaignTitle}`"
    :ui="{ container: 'max-w-md mx-auto', content: 'max-h-[92dvh]' }"
  >
    <template #body>
      <UForm
        id="donation-form"
        :schema="donateSchema"
        :state="state"
        class="space-y-5 overflow-y-auto pb-2"
        @submit="onSubmit"
      >
        <!--
          Two honest one-liners rather than a gate: a signed-in donor is told
          their donation will land in their history, and a guest is told an
          account is optional and where their receipt will live instead.
        -->
        <div
          class="flex items-start gap-2.5 rounded-xl p-3.5"
          :class="
            isLoggedIn ? 'bg-primary-50 text-primary-700' : 'bg-elevated text-toned'
          "
        >
          <UIcon
            :name="
              isLoggedIn
                ? 'i-material-symbols-account-circle-rounded'
                : 'i-material-symbols-info-rounded'
            "
            class="mt-0.5 size-5 shrink-0"
          />
          <p v-if="isLoggedIn" class="text-xs leading-relaxed">
            Anda berdonasi sebagai
            <span class="font-semibold">{{ user?.name }}</span
            >. Donasi ini otomatis tercatat di
            <NuxtLink to="/akun/donasi" class="font-semibold underline">
              riwayat donasi
            </NuxtLink>
            Anda.
          </p>
          <p v-else class="text-xs leading-relaxed">
            <span class="font-semibold">Tidak perlu punya akun untuk berdonasi.</span>
            Anda akan menerima kode donasi yang sudah cukup untuk melacak statusnya. Agar
            donasi ini ikut tersimpan dalam riwayat donasi Anda,
            <NuxtLink :to="loginLink" class="font-semibold text-primary underline">
              masuk ke akun
            </NuxtLink>
            lebih dulu.
          </p>
        </div>

        <UFormField name="amount" label="Nominal donasi">
          <div class="grid grid-cols-3 gap-2">
            <UButton
              v-for="quick in QUICK_AMOUNTS"
              :key="quick"
              :label="formatCurrencyShort(quick)"
              :color="state.amount === quick ? 'primary' : 'neutral'"
              :variant="state.amount === quick ? 'subtle' : 'outline'"
              size="md"
              block
              :aria-pressed="state.amount === quick"
              @click="state.amount = quick"
            />
          </div>

          <!--
            The locale is pinned because `IDR` renders as the ISO code "IDR" in
            every locale but Indonesian — only `id-ID` prints the "Rp" symbol
            donors actually read, and it groups with the dots they expect.
          -->
          <UInputNumber
            v-model="state.amount"
            locale="id-ID"
            :min="0"
            :step="10_000"
            :format-options="{
              style: 'currency',
              currency: 'IDR',
              currencyDisplay: 'symbol',
              maximumFractionDigits: 0,
            }"
            class="mt-3 w-full"
            aria-label="Nominal donasi lainnya"
          />

          <template #help>
            Minimal donasi {{ formatCurrency(MIN_DONATION_AMOUNT) }}
          </template>
        </UFormField>

        <!--
          The roster and the alias share one field: they are the same answer to
          "whose donation is this", and splitting them left a disabled input
          sitting above the one that actually shipped.
        -->
        <UFormField name="donorNames">
          <template #label>
            <span class="inline-flex items-center gap-1">
              Nama donatur
              <!--
                A popover rather than a tooltip: this is read on a phone, and a
                tooltip has no open gesture on touch.
              -->
              <UPopover :ui="{ content: 'max-w-72 p-3' }">
                <UButton
                  icon="i-material-symbols-info-outline-rounded"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  aria-label="Untuk apa nama ini dipakai"
                  :ui="{ base: 'p-0.5' }"
                />

                <template #content>
                  <p class="text-xs leading-relaxed text-muted">
                    Nama di kolom ini yang dicetak pada sertifikat donasi. Satu donasi
                    boleh diatasnamakan lebih dari satu orang — tambahkan nama lain bila
                    donasi ini dari keluarga atau hasil patungan.
                  </p>
                </template>
              </UPopover>
            </span>
          </template>

          <template #hint>
            <UCheckbox v-model="isAnonymous" label="Sembunyikan nama" size="sm" />
          </template>

          <div v-if="!isAnonymous" class="space-y-2">
            <UFormField
              v-for="(_, index) in realNames"
              :key="index"
              :name="`donorNames.${index}`"
            >
              <div class="flex gap-2">
                <UInput
                  v-model="realNames[index]"
                  :placeholder="index === 0 ? 'Nama Anda' : `Nama ke-${index + 1}`"
                  :aria-label="`Nama donatur ${index + 1}`"
                  class="flex-1"
                />
                <UButton
                  v-if="realNames.length > 1"
                  icon="i-material-symbols-close-rounded"
                  color="neutral"
                  variant="outline"
                  :aria-label="`Hapus nama ke-${index + 1}`"
                  @click="removeName(index)"
                />
              </div>
            </UFormField>

            <UButton
              v-if="realNames.length < MAX_DONOR_NAMES"
              icon="i-material-symbols-add-rounded"
              label="Tambah nama"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="addName"
            />
          </div>

          <div v-else class="space-y-2">
            <div class="flex gap-2">
              <USelect v-model="anonymousName" :items="ANONYMOUS_NAMES" class="flex-1" />
              <UButton
                icon="i-material-symbols-shuffle-rounded"
                color="neutral"
                variant="outline"
                aria-label="Acak nama"
                @click="randomizeName"
              />
            </div>
            <p class="text-xs text-muted">
              Nama ini yang tampil di halaman program sekaligus tercetak di sertifikat.
            </p>
          </div>
        </UFormField>

        <UFormField name="message" label="Doa atau pesan">
          <UTextarea
            v-model="state.message"
            :rows="3"
            :maxlength="300"
            placeholder="Tulis doa atau pesan untuk penerima manfaat..."
            class="w-full"
            :ui="{ base: 'resize-none' }"
          />
          <template #help>
            Doa Anda akan tampil di halaman program. {{ 300 - state.message.length }}
            karakter tersisa.
          </template>
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton
        type="submit"
        form="donation-form"
        label="Lanjutkan pembayaran"
        color="primary"
        size="xl"
        block
        :loading="pending"
        :loading-auto="false"
      />
    </template>
  </UDrawer>
</template>
