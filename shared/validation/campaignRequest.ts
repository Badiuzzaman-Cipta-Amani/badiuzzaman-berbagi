import * as v from "valibot"

export const MIN_CAMPAIGN_TARGET = 1_000_000

/**
 * "Galang Donasi" submissions. Lives beside `donate.ts` so the endpoint that
 * eventually accepts these rejects exactly what the form already rejects.
 */
export const campaignRequestSchema = v.object({
  title: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Judul program wajib diisi"),
    v.maxLength(120, "Judul maksimal 120 karakter"),
  ),
  category: v.pipe(v.string(), v.nonEmpty("Pilih salah satu kategori")),
  target: v.pipe(
    v.number("Target donasi wajib diisi"),
    v.integer("Target donasi harus berupa angka bulat"),
    v.minValue(
      MIN_CAMPAIGN_TARGET,
      `Target donasi minimal Rp${MIN_CAMPAIGN_TARGET.toLocaleString("id-ID")}`,
    ),
  ),
  story: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(40, "Ceritakan kondisinya dalam minimal 40 karakter"),
  ),
  beneficiary: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Nama penerima manfaat wajib diisi"),
  ),
  whatsapp: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Nomor WhatsApp wajib diisi"),
    v.regex(/^(\+?62|0)8[1-9][0-9]{6,10}$/, "Gunakan format 08xx atau +628xx"),
  ),
})

export type CampaignRequestInput = v.InferOutput<typeof campaignRequestSchema>
