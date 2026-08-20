/**
 * Single source for the foundation's own facts. The footer, the "dipersembahkan
 * oleh" panel, and /tentang all read from here so they cannot drift apart.
 *
 * `socials` renders only entries that carry a `href`. Leaving one `null` hides
 * the icon rather than shipping a link to `#`.
 */
export const site = {
  name: "Badiuzzaman Berbagi",
  foundation: "Yayasan Khairul Ummat Badiuzzaman Al-Fatih",
  tagline: "Berbagi kebaikan, menyebarkan harapan.",
  foundedYear: 2015,

  address: "Jl. Kebon Jeruk No. 123, Jakarta Barat",
  phone: { label: "(021) 1234-5678", href: "tel:+622112345678" },
  email: { label: "info@badiuzzaman.or.id", href: "mailto:info@badiuzzaman.or.id" },
  whatsapp: { label: "+62 812-3456-7890", href: "https://wa.me/6281234567890" },

  /** Embed URL for the office pin. */
  mapsEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d253840.48788459773!2d106.68942855!3d-6.22972855!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e945e34b9d%3A0x5371bf0fdad786a2!2sJakarta%2C%20Indonesia!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus",

  /** Fill a `href` in to publish that icon; `null` keeps it off the page. */
  socials: [
    { label: "Instagram", icon: "i-simple-icons-instagram", href: null },
    { label: "YouTube", icon: "i-simple-icons-youtube", href: null },
    { label: "TikTok", icon: "i-simple-icons-tiktok", href: null },
    { label: "Facebook", icon: "i-simple-icons-facebook", href: null },
  ] as { label: string; icon: string; href: string | null }[],

  legal: [
    { label: "Akta Notaris", value: "No. 45 Tahun 2015" },
    { label: "SK Kemenkumham", value: "AHU-0012856.AH.01.04 Tahun 2015" },
    { label: "NPWP", value: "09.234.567.8-123.000" },
  ],
} as const

export const activeSocials = site.socials.filter(
  (social): social is { label: string; icon: string; href: string } =>
    Boolean(social.href),
)

export type SiteMedia = {
  kind: "image" | "video"
  /** Direct file URL. For `video`, something a `<video>` element can play. */
  url: string
  /** Still frame for a video tile; images use `url` for both. */
  poster?: string
  caption: string
}

/**
 * Photo and video documentation for /tentang.
 *
 * These entries are **placeholders**, and are labelled as such on the page —
 * replace the URLs and captions with the foundation's own files. Captions
 * deliberately do not name a place, a date, or a beneficiary: a caption on a
 * stock photo would be a fabricated record of something that did not happen.
 *
 * Emptying this array hides the whole section rather than rendering an empty
 * grid, so removing the placeholders before launch is a safe no-op.
 */
export const documentation: SiteMedia[] = [
  {
    kind: "image",
    url: "https://picsum.photos/seed/badiuzzaman-doc-1/800/800",
    caption: "Penyaluran bantuan",
  },
  {
    kind: "image",
    url: "https://picsum.photos/seed/badiuzzaman-doc-2/800/800",
    caption: "Kegiatan belajar",
  },
  {
    kind: "video",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    poster: "https://picsum.photos/seed/badiuzzaman-doc-3/800/800",
    caption: "Liputan kegiatan",
  },
  {
    kind: "image",
    url: "https://picsum.photos/seed/badiuzzaman-doc-4/800/800",
    caption: "Pembangunan sarana",
  },
  {
    kind: "image",
    url: "https://picsum.photos/seed/badiuzzaman-doc-5/800/800",
    caption: "Distribusi paket",
  },
  {
    kind: "video",
    url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    poster: "https://picsum.photos/seed/badiuzzaman-doc-6/800/800",
    caption: "Testimoni penerima manfaat",
  },
]
