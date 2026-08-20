type SeoOptions = {
  title: string
  description: string
  image?: string
  type?: "website" | "article"
  publishedAt?: string
  modifiedAt?: string
  keywords?: string[]
}

const DEFAULT_KEYWORDS = ["donasi", "amal", "sedekah", "zakat", "indonesia"]

const ORGANIZATION = "Yayasan Khairul Ummat Badiuzzaman Al-Fatih"

export function usePageSeo(options: SeoOptions) {
  const site = useSiteConfig()
  const route = useRoute()

  const url = computed(() => `${site.url}${route.path}`)
  const image = computed(() => options.image ?? `${site.url}/og-image.jpg`)

  useHead({
    meta: [
      {
        name: "keywords",
        content: (options.keywords ?? DEFAULT_KEYWORDS).join(", "),
      },
    ],
    link: [{ rel: "canonical", href: url }],
    script: [
      {
        type: "application/ld+json",
        innerHTML: computed(() =>
          JSON.stringify({
            "@context": "https://schema.org",
            "@type": options.type === "article" ? "Article" : "WebPage",
            headline: options.title,
            description: options.description,
            image: image.value,
            url: url.value,
            datePublished: options.publishedAt,
            dateModified: options.modifiedAt,
            author: { "@type": "Organization", name: ORGANIZATION },
            publisher: {
              "@type": "Organization",
              name: site.name,
              logo: { "@type": "ImageObject", url: `${site.url}/logo.png` },
            },
          }),
        ),
      },
    ],
  })

  useSeoMeta({
    title: options.title,
    description: options.description,
    ogTitle: options.title,
    ogDescription: options.description,
    ogImage: image,
    ogUrl: url,
    ogType: options.type ?? "website",
    twitterCard: "summary_large_image",
    twitterTitle: options.title,
    twitterDescription: options.description,
    twitterImage: image,
  })
}
