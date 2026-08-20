export type SortPresentation = {
  value: CampaignSortOption
  label: string
  icon: string
}

/** Mirrors `CAMPAIGN_SORT_OPTIONS`; the API rejects anything outside it. */
export const sortOptions: SortPresentation[] = [
  { value: "latest", label: "Terbaru", icon: "i-material-symbols-schedule-rounded" },
  { value: "oldest", label: "Terlama", icon: "i-material-symbols-history-rounded" },
  {
    value: "urgent",
    label: "Paling Mendesak",
    icon: "i-material-symbols-local-fire-department-rounded",
  },
  {
    value: "popular",
    label: "Paling Populer",
    icon: "i-material-symbols-favorite-rounded",
  },
  {
    value: "almost_reach",
    label: "Hampir Tercapai",
    icon: "i-material-symbols-trending-up-rounded",
  },
  {
    value: "highest_nominal",
    label: "Nominal Tertinggi",
    icon: "i-material-symbols-sort-rounded",
  },
]

export const sortLabel = (value: CampaignSortOption) =>
  sortOptions.find((option) => option.value === value)?.label ?? "Urutkan"
