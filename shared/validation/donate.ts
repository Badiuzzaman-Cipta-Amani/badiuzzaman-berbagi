import * as v from "valibot"

export const MIN_DONATION_AMOUNT = 10_000

/**
 * A donation may be given in several people's names — a family, a patungan —
 * and every one of them is printed on the certificate. The ceiling exists so a
 * certificate stays a certificate rather than a roster nobody can lay out.
 */
export const MAX_DONOR_NAMES = 10

/** Shared by the donate endpoint and the donation form so both reject the same input. */
export const donateSchema = v.object({
  donorNames: v.pipe(
    v.array(v.pipe(v.string(), v.trim(), v.nonEmpty("Nama donatur wajib diisi"))),
    v.minLength(1, "Nama donatur wajib diisi"),
    v.maxLength(MAX_DONOR_NAMES, `Maksimal ${MAX_DONOR_NAMES} nama donatur`),
  ),
  message: v.pipe(v.string(), v.trim(), v.nonEmpty("Doa atau pesan wajib diisi")),
  amount: v.pipe(
    v.number("Nominal donasi wajib diisi"),
    v.integer("Nominal donasi harus berupa angka bulat"),
    v.minValue(
      MIN_DONATION_AMOUNT,
      `Nominal donasi minimal Rp${MIN_DONATION_AMOUNT.toLocaleString("id-ID")}`,
    ),
  ),
})

export type DonateInput = v.InferOutput<typeof donateSchema>
