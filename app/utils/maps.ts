/**
 * Google Maps *links* — what the admin form collects — do not render inside an
 * iframe: `/maps/place/...` and the `goo.gl` shorteners both refuse to be
 * framed. Only the `output=embed` and `/maps/embed` forms do.
 *
 * So the pin is recovered from whatever shape the link came in as and handed to
 * the one URL Google will frame. Coordinates are preferred because they survive
 * every link format; a place name is the fallback; and when neither is
 * recoverable the caller gets `null` and shows the plain link instead of an
 * iframe that would render an error page.
 */

/** `@-6.2088,106.8456,15z` and the `!3d-6.2088!4d106.8456` data blob. */
const AT_COORDS = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
const DATA_COORDS = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/
/** A bare "lat,lng" pair, as pasted from the Maps "copy coordinates" action. */
const BARE_COORDS = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/

const embedFor = (query: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`

export function mapsEmbedUrl(
  link?: string | null,
  fallbackPlace?: string | null,
): string | null {
  const raw = link?.trim() ?? ""

  // Already framable — an embed URL from the Maps "share → embed" dialog.
  if (raw.includes("/maps/embed") || raw.includes("output=embed")) return raw

  const bare = BARE_COORDS.exec(raw)
  if (bare) return embedFor(`${bare[1]},${bare[2]}`)

  if (raw) {
    const coords = AT_COORDS.exec(raw) ?? DATA_COORDS.exec(raw)
    if (coords) return embedFor(`${coords[1]},${coords[2]}`)

    try {
      const url = new URL(raw)
      const q = url.searchParams.get("q") ?? url.searchParams.get("query")
      if (q) return embedFor(q)

      // `/maps/place/Masjid+Al-Falah/...` — the segment after `place` is the name.
      const place = url.pathname.split("/").filter(Boolean)
      const index = place.indexOf("place")
      const name = index >= 0 ? place[index + 1] : undefined
      if (name) return embedFor(decodeURIComponent(name.replace(/\+/g, " ")))
    } catch {
      // Not a URL at all — fall through and treat the fallback as the pin.
    }
  }

  const place = fallbackPlace?.trim()
  return place ? embedFor(place) : null
}
