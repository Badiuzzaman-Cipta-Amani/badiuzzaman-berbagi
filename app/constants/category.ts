export type CategoryPresentation = {
  key: CampaignCategory
  name: string
  icon: string
  /** One recipe for all six: `-700` mark on a `-50` field, so the set reads as a family. */
  tint: string
}

/**
 * Presentation for the `CampaignCategory` enum. The keys are the contract with
 * the database; the Indonesian names exist only for display.
 */
export const categories: CategoryPresentation[] = [
  {
    key: "borehole",
    name: "Sumur Bor",
    icon: "i-material-symbols-water-drop-rounded",
    tint: "bg-sky-50 text-sky-700",
  },
  {
    key: "islamic_boarding_school",
    name: "Pondok Pesantren",
    icon: "i-material-symbols-auto-stories-rounded",
    tint: "bg-teal-50 text-teal-700",
  },
  {
    key: "orphan",
    name: "Anak Yatim",
    icon: "i-material-symbols-child-care-rounded",
    tint: "bg-amber-50 text-amber-700",
  },
  {
    key: "social",
    name: "Sosial",
    icon: "i-material-symbols-diversity-3-rounded",
    tint: "bg-rose-50 text-rose-700",
  },
  {
    key: "mosque",
    name: "Masjid",
    icon: "i-material-symbols-mosque-rounded",
    tint: "bg-indigo-50 text-indigo-700",
  },
  {
    key: "education",
    name: "Pendidikan",
    icon: "i-material-symbols-school-rounded",
    tint: "bg-emerald-50 text-emerald-700",
  },
]

const categoryByKey = new Map(categories.map((category) => [category.key, category]))

export const findCategory = (key: CampaignCategory | string | null | undefined) =>
  key ? categoryByKey.get(key as CampaignCategory) : undefined

export const categoryLabel = (key: CampaignCategory | string | null | undefined) =>
  findCategory(key)?.name ?? "Lainnya"
