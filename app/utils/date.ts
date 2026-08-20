const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

export const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "-"
  return Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value))
}

/** Axis ticks and dense table cells, where "18 Agustus 2026" will not fit. */
export const formatDateShort = (value: string | Date | null | undefined) => {
  if (!value) return "-"
  return Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    new Date(value),
  )
}

/** "2 jam yang lalu" style stamps for duas and updates. */
export const formatRelativeTime = (value: string | Date | null | undefined) => {
  if (!value) return "-"

  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)

  if (seconds < MINUTE) return "Baru saja"
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)} menit yang lalu`
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)} jam yang lalu`
  if (seconds < DAY * 30) return `${Math.floor(seconds / DAY)} hari yang lalu`

  return formatDate(value)
}
