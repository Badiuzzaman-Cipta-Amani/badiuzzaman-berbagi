import * as v from "valibot"

/**
 * The donor's half of verification. There is no upload pipeline yet, so proof
 * is a link the donor pastes — the same shape campaign artwork uses. When a
 * bucket lands, this is the schema that changes.
 */
export const confirmDonationSchema = v.object({
  proofUrl: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Tautan bukti transfer wajib diisi"),
    v.url("Tautan bukti transfer harus berupa URL yang lengkap"),
  ),
  proofNote: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(300, "Catatan maksimal 300 karakter")),
    "",
  ),
})

/** The reference a donor quotes, e.g. `BZ-7K3P9Q`. Case is normalised on the way in. */
export const donationReferenceSchema = v.pipe(
  v.string(),
  v.trim(),
  v.toUpperCase(),
  v.nonEmpty("Kode donasi wajib diisi"),
  v.regex(/^BZ-[0-9A-Z]{6}$/, "Kode donasi tidak dikenali"),
)

export type ConfirmDonationInput = v.InferOutput<typeof confirmDonationSchema>
