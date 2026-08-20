export const formatNumber = (num: number) => Intl.NumberFormat("id-ID").format(num)

export const formatCurrency = (num: number | bigint) =>
  Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num)

/** Compact form for tight spots: `Rp25jt`, `Rp250rb`. */
export const formatCurrencyShort = (num: number) => {
  if (num >= 1_000_000_000)
    return `Rp${(num / 1_000_000_000).toFixed(1).replace(".0", "")}m`
  if (num >= 1_000_000) return `Rp${(num / 1_000_000).toFixed(1).replace(".0", "")}jt`
  if (num >= 1_000) return `Rp${Math.round(num / 1_000)}rb`
  return formatCurrency(num)
}
