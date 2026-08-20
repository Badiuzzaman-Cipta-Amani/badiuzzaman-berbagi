import type { AdminPermission } from "../shared/constants/permission"

import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

import { PrismaClient } from "./generated/client"

// Also runnable standalone via `tsx prisma/seed.ts`, so load .env here too.
try {
  process.loadEnvFile()
} catch {
  // No .env file present — rely on the ambient environment instead.
}

const connectionString = process.env.NUXT_DATABASE_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("NUXT_DATABASE_URL or DATABASE_URL must be defined")
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

/** One shared secret for every seeded account — this data never leaves a dev box. */
const SEED_PASSWORD = "testing123"

const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000)
const daysAgo = (days: number) => daysFromNow(-days)

/**
 * Deterministic pseudo-random, so re-seeding produces the same dashboard numbers
 * and a chart that moved is a real change rather than noise.
 */
function makeRandom(seed: number) {
  let state = seed

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296
    return state / 4_294_967_296
  }
}

const random = makeRandom(20260814)

const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]!

type RoleSeed = {
  name: string
  label: string
  description: string
  permissions: AdminPermission[]
}

/**
 * Permissions are overwritten on re-seed, unlike the rest of the upserts: the
 * catalogue in `shared/constants/permission.ts` is the source of truth, so a
 * role left holding a key that no longer exists would be a lie the UI repeats.
 * `super_admin` stores none — it resolves to the full set at read time.
 */
async function ensureRole(seed: RoleSeed) {
  const data = {
    label: seed.label,
    description: seed.description,
    permissions: seed.permissions,
  }

  return prisma.role.upsert({
    where: { name: seed.name },
    update: data,
    create: { name: seed.name, ...data },
  })
}

async function ensureAdmin(data: {
  name: string
  email: string
  roleId: number
  isActive?: boolean
}) {
  const password = await bcrypt.hash(SEED_PASSWORD, 10)

  return prisma.admin.upsert({
    where: { email: data.email },
    update: { name: data.name, roleId: data.roleId, isActive: data.isActive ?? true },
    create: { ...data, password },
  })
}

async function ensureUser(email: string, data: { name: string; phone?: string | null }) {
  const password = await bcrypt.hash(SEED_PASSWORD, 10)

  return prisma.user.upsert({
    where: { email },
    update: data,
    create: { email, ...data, password },
  })
}

async function ensureFundraiser(
  name: string,
  data: { googleMaps: string; description: string },
) {
  const existing = await prisma.fundraiser.findFirst({ where: { name } })

  if (existing) {
    return prisma.fundraiser.update({ where: { id: existing.id }, data })
  }

  return prisma.fundraiser.create({ data: { name, ...data } })
}

type CampaignSeed = {
  title: string
  slug: string
  category:
    | "borehole"
    | "islamic_boarding_school"
    | "orphan"
    | "social"
    | "mosque"
    | "education"
  excerpt: string
  description: string
  location: string
  mapsUrl: string
  targetAmount: bigint
  status: "draft" | "active" | "completed" | "cancelled"
  endAt: Date
  createdAt: Date
  fundraiserId: bigint
  /** Picsum seeds; `path` is the directory prefix and `name` the file segment. */
  images: string[]
}

async function ensureCampaign(seed: CampaignSeed) {
  const { images, ...data } = seed

  // `raisedAmount` is derived from verified donations further down, so it is
  // deliberately left at its default here rather than hardcoded out of sync.
  const campaign = await prisma.campaign.upsert({
    where: { slug: data.slug },
    update: { ...data, verifiedAt: data.status === "draft" ? null : new Date() },
    create: { ...data, verifiedAt: data.status === "draft" ? null : new Date() },
  })

  // Re-seeding must not stack duplicate artwork on the same campaign.
  await prisma.campaignAttachment.deleteMany({ where: { campaignId: campaign.id } })
  await prisma.campaignAttachment.createMany({
    data: images.map((image, index) => ({
      campaignId: campaign.id,
      name: "1200",
      path: `https://picsum.photos/seed/${image}`,
      mime: "image/jpeg",
      size: 250_000,
      width: 1200,
      height: 800,
      alt: `Dokumentasi ${data.title}`,
      sortOrder: index,
    })),
  })

  return campaign
}

const DONOR_NAMES = [
  "Hamba Allah",
  "Dermawan",
  "Sahabat Berbagi",
  "Pelita Harapan",
  "Keluarga Rahmat",
  "Ahmad Fauzi",
  "Siti Nurhaliza",
  "Budi Santoso",
  "Nur Aisyah",
  "Rizky Ramadhan",
] as const

const DUA_MESSAGES = [
  "Semoga menjadi amal jariyah yang tidak terputus.",
  "Semoga bermanfaat dan berkah untuk semua.",
  "Semoga Allah mudahkan segala urusan panitia.",
  "Sedikit dari kami, semoga meringankan.",
  "Semoga proyek ini segera rampung.",
  "Barakallahu fiikum.",
  "Semoga menjadi pemberat timbangan amal.",
  "Titip doa untuk keluarga kami.",
] as const

const NOMINALS = [
  50_000n,
  100_000n,
  250_000n,
  500_000n,
  1_000_000n,
  2_500_000n,
  5_000_000n,
] as const

async function main() {
  console.log("🌱 Starting database seed...")

  const superAdminRole = await ensureRole({
    name: "super_admin",
    label: "Super Admin",
    description: "Akses penuh, termasuk mengelola akun admin dan peran.",
    permissions: [],
  })
  const adminRole = await ensureRole({
    name: "admin",
    label: "Admin Program",
    description: "Mengelola campaign, kabar, doa, donatur, dan lembaga.",
    permissions: [
      "dashboard.view",
      "donation.view",
      "campaign.view",
      "campaign.manage",
      "update.view",
      "update.manage",
      "dua.view",
      "dua.moderate",
      "user.view",
      "user.manage",
      "fundraiser.view",
      "fundraiser.manage",
    ],
  })
  // Deliberately narrow: proof that a non-super role really is limited.
  const financeRole = await ensureRole({
    name: "finance",
    label: "Tim Keuangan",
    description: "Memverifikasi donasi masuk tanpa mengubah konten campaign.",
    permissions: ["dashboard.view", "donation.view", "donation.verify", "campaign.view"],
  })

  const superAdmin = await ensureAdmin({
    name: "Super Admin",
    email: "superadmin@badiuzzaman.co.id",
    roleId: superAdminRole.id,
  })
  await ensureAdmin({
    name: "Admin Program",
    email: "admin@badiuzzaman.co.id",
    roleId: adminRole.id,
  })
  const financeAdmin = await ensureAdmin({
    name: "Admin Keuangan",
    email: "keuangan@badiuzzaman.co.id",
    roleId: financeRole.id,
  })
  await ensureAdmin({
    name: "Admin Nonaktif",
    email: "nonaktif@badiuzzaman.co.id",
    roleId: adminRole.id,
    isActive: false,
  })

  const users = []
  for (const seed of [
    { email: "user@example.com", name: "Demo User", phone: "081234567890" },
    { email: "ahmad.fauzi@example.com", name: "Ahmad Fauzi", phone: "081234567891" },
    { email: "siti.nur@example.com", name: "Siti Nurhaliza", phone: "081234567892" },
    { email: "budi.santoso@example.com", name: "Budi Santoso", phone: "081234567893" },
    { email: "nur.aisyah@example.com", name: "Nur Aisyah", phone: null },
    { email: "rizky.r@example.com", name: "Rizky Ramadhan", phone: "081234567895" },
  ]) {
    const { email, ...data } = seed
    users.push(await ensureUser(email, data))
  }

  const yayasan = await ensureFundraiser("Yayasan Peduli Sesama", {
    googleMaps: "https://maps.google.com/?q=Jakarta",
    description:
      "Yayasan sosial yang menyalurkan bantuan air bersih dan sarana ibadah bagi desa-desa terpencil di Jawa dan Nusa Tenggara.",
  })
  const komunitas = await ensureFundraiser("Komunitas Berbagi Indonesia", {
    googleMaps: "https://maps.google.com/?q=Bandung",
    description:
      "Komunitas relawan yang fokus pada pendampingan anak yatim dan beasiswa pendidikan dasar.",
  })
  const lembaga = await ensureFundraiser("Lembaga Amil Badiuzzaman", {
    googleMaps: "https://maps.google.com/?q=Surabaya",
    description:
      "Lembaga amil zakat yang mengelola penghimpunan dan penyaluran zakat, infaq, dan sedekah secara transparan.",
  })

  // Ends inside the 15-day urgency window, so /campaigns/critical has a result.
  const boreholeCampaign = await ensureCampaign({
    title: "Sumur Bor untuk Desa Kekeringan",
    slug: "sumur-bor-untuk-desa-kekeringan",
    category: "borehole",
    excerpt: "Bantu sediakan air bersih bagi warga desa yang dilanda kekeringan.",
    description:
      "Warga desa harus berjalan lebih dari tiga kilometer setiap hari untuk mendapatkan air bersih. Dana yang terkumpul akan digunakan untuk pengeboran sumur, pemasangan pompa, dan pembangunan bak penampungan air yang dapat dimanfaatkan oleh seluruh warga.",
    location: "Gunung Kidul, Yogyakarta",
    mapsUrl: "https://maps.google.com/?q=Gunung+Kidul",
    targetAmount: 75_000_000n,
    status: "active",
    endAt: daysFromNow(9),
    createdAt: daysAgo(80),
    fundraiserId: yayasan.id,
    images: ["sumur-bor-1", "sumur-bor-2", "sumur-bor-3"],
  })

  const pesantrenCampaign = await ensureCampaign({
    title: "Renovasi Asrama Pondok Pesantren",
    slug: "renovasi-asrama-pondok-pesantren",
    category: "islamic_boarding_school",
    excerpt: "Perbaikan asrama santri yang sudah tidak layak huni.",
    description:
      "Asrama yang dihuni lebih dari 120 santri mengalami kerusakan pada atap dan dinding. Dana akan digunakan untuk perbaikan struktur bangunan, penggantian atap, serta penyediaan tempat tidur dan lemari bagi para santri.",
    location: "Tasikmalaya, Jawa Barat",
    mapsUrl: "https://maps.google.com/?q=Tasikmalaya",
    targetAmount: 150_000_000n,
    status: "active",
    endAt: daysFromNow(75),
    createdAt: daysAgo(64),
    fundraiserId: komunitas.id,
    images: ["pesantren-1", "pesantren-2"],
  })

  const orphanCampaign = await ensureCampaign({
    title: "Beasiswa Pendidikan Anak Yatim",
    slug: "beasiswa-pendidikan-anak-yatim",
    category: "orphan",
    excerpt: "Bantu anak-anak yatim mendapatkan pendidikan yang lebih baik.",
    description:
      "Dana yang terkumpul akan digunakan untuk kebutuhan pendidikan anak yatim, termasuk biaya sekolah, buku, seragam, dan perlengkapan belajar selama satu tahun ajaran penuh.",
    location: "Bandung, Jawa Barat",
    mapsUrl: "https://maps.google.com/?q=Bandung",
    targetAmount: 50_000_000n,
    status: "active",
    endAt: daysFromNow(120),
    createdAt: daysAgo(47),
    fundraiserId: komunitas.id,
    images: ["yatim-1", "yatim-2"],
  })

  const mosqueCampaign = await ensureCampaign({
    title: "Pembangunan Masjid Al-Ikhlas",
    slug: "pembangunan-masjid-al-ikhlas",
    category: "mosque",
    excerpt: "Wujudkan tempat ibadah yang layak bagi warga sekitar.",
    description:
      "Masjid yang ada saat ini hanya berupa bangunan semi permanen dengan kapasitas terbatas. Dana akan digunakan untuk pembangunan masjid permanen berkapasitas 300 jamaah beserta tempat wudhu dan sarana pendukungnya.",
    location: "Bekasi, Jawa Barat",
    mapsUrl: "https://maps.google.com/?q=Bekasi",
    targetAmount: 300_000_000n,
    status: "active",
    endAt: daysFromNow(45),
    createdAt: daysAgo(120),
    fundraiserId: yayasan.id,
    images: ["masjid-1", "masjid-2"],
  })

  // A finished and an unpublished campaign, so the admin status filters and the
  // dashboard breakdown are exercised by real rows rather than an empty state.
  const socialCampaign = await ensureCampaign({
    title: "Dapur Umum Korban Banjir",
    slug: "dapur-umum-korban-banjir",
    category: "social",
    excerpt: "Menyediakan makanan hangat bagi pengungsi banjir.",
    description:
      "Dapur umum beroperasi selama masa tanggap darurat untuk menyediakan tiga kali makan bagi lebih dari 400 pengungsi, beserta kebutuhan air minum dan perlengkapan kebersihan dasar.",
    location: "Demak, Jawa Tengah",
    mapsUrl: "https://maps.google.com/?q=Demak",
    targetAmount: 40_000_000n,
    status: "completed",
    endAt: daysAgo(12),
    createdAt: daysAgo(150),
    fundraiserId: lembaga.id,
    images: ["banjir-1", "banjir-2"],
  })

  const educationCampaign = await ensureCampaign({
    title: "Kelas Komputer untuk Sekolah Pelosok",
    slug: "kelas-komputer-untuk-sekolah-pelosok",
    category: "education",
    excerpt: "Pengadaan perangkat belajar digital bagi sekolah di daerah 3T.",
    description:
      "Sekolah belum memiliki satu pun perangkat komputer. Dana akan digunakan untuk pengadaan 15 unit komputer bekas layak pakai, jaringan listrik kelas, serta pelatihan singkat bagi guru pendamping.",
    location: "Sumba Timur, NTT",
    mapsUrl: "https://maps.google.com/?q=Sumba+Timur",
    targetAmount: 90_000_000n,
    status: "draft",
    endAt: daysFromNow(150),
    createdAt: daysAgo(5),
    fundraiserId: lembaga.id,
    images: ["komputer-1"],
  })

  const campaigns = [
    boreholeCampaign,
    pesantrenCampaign,
    orphanCampaign,
    mosqueCampaign,
    socialCampaign,
    educationCampaign,
  ]
  const campaignIds = campaigns.map((campaign) => campaign.id)

  await prisma.campaignUpdate.deleteMany({ where: { campaignId: { in: campaignIds } } })
  await prisma.campaignUpdate.createMany({
    data: [
      {
        campaignId: boreholeCampaign.id,
        title: "Survei lokasi pengeboran selesai",
        description:
          "Tim teknis telah menyelesaikan survei geolistrik dan menemukan titik sumber air pada kedalaman 60 meter.",
        createdAt: daysAgo(40),
      },
      {
        campaignId: boreholeCampaign.id,
        title: "Pengeboran tahap pertama dimulai",
        description:
          "Alat bor telah tiba di lokasi dan proses pengeboran dimulai dengan pendampingan warga setempat.",
        createdAt: daysAgo(11),
      },
      {
        campaignId: pesantrenCampaign.id,
        title: "Pembongkaran atap lama",
        description:
          "Atap asrama yang lapuk telah dibongkar dan material pengganti sedang dalam pengiriman.",
        createdAt: daysAgo(20),
      },
      {
        campaignId: orphanCampaign.id,
        title: "Penyaluran perlengkapan sekolah",
        description:
          "Sebanyak 40 paket perlengkapan sekolah telah disalurkan kepada penerima manfaat.",
        createdAt: daysAgo(9),
      },
      {
        campaignId: mosqueCampaign.id,
        title: "Pengecoran lantai dasar",
        description:
          "Pengecoran lantai dasar telah rampung dan pekerjaan dilanjutkan ke pemasangan dinding.",
        createdAt: daysAgo(30),
      },
      {
        campaignId: socialCampaign.id,
        title: "Laporan akhir penyaluran",
        description:
          "Dapur umum ditutup setelah 18 hari beroperasi dengan total 21.600 porsi makanan tersalurkan.",
        createdAt: daysAgo(10),
      },
    ],
  })

  // Donations are spread across the last 90 days so the dashboard trend chart
  // has a real series to draw instead of a single spike.
  await prisma.donation.deleteMany({ where: { campaignId: { in: campaignIds } } })

  const fundableCampaigns = [
    boreholeCampaign,
    pesantrenCampaign,
    orphanCampaign,
    mosqueCampaign,
    socialCampaign,
  ]

  const donations: {
    userId: bigint | null
    campaignId: bigint
    reference: string
    amount: bigint
    message: string | null
    donorName: string
    donorNames: string[]
    status: "pending" | "verified" | "rejected"
    verifiedAt: Date | null
    verifiedById: bigint | null
    reviewNote: string | null
    proofUrl: string | null
    proofNote: string | null
    confirmedAt: Date | null
    isDuaHidden: boolean
    createdAt: Date
  }[] = []

  /**
   * Seeded references have to be deterministic like everything else here, so
   * they are derived from the row index rather than drawn at random. The shape
   * still matches what `generateDonationReference()` produces at runtime.
   */
  const seedReference = (index: number) =>
    `BZ-SEED${index.toString(36).toUpperCase().padStart(2, "0")}`

  for (let index = 0; index < 90; index++) {
    const campaign = pick(fundableCampaigns)
    const createdAt = daysAgo(Math.floor(random() * 90))
    const roll = random()

    // Recent donations skew pending: that is the queue the verification screen exists for.
    const status = roll < 0.12 ? "rejected" : roll < 0.32 ? "pending" : "verified"
    const isRegistered = random() < 0.45
    const user = isRegistered ? pick(users) : null

    // Most donors send proof; the ones who have not are exactly the rows an
    // admin should be able to tell apart in the queue, so some are left blank.
    const hasProof = status !== "pending" || random() < 0.6

    // A fifth of donations are given in more than one name — a family or a
    // patungan — so the certificate roster has rows that actually exercise it.
    const primaryName = user?.name ?? pick(DONOR_NAMES)
    const donorNames = random() < 0.2 ? [primaryName, pick(DONOR_NAMES)] : [primaryName]

    donations.push({
      userId: user?.id ?? null,
      campaignId: campaign.id,
      reference: seedReference(index),
      amount: pick(NOMINALS),
      message: random() < 0.75 ? pick(DUA_MESSAGES) : null,
      donorNames,
      donorName: donorNames.join(", "),
      status,
      verifiedAt: status === "verified" ? createdAt : null,
      verifiedById: status === "pending" ? null : financeAdmin.id,
      reviewNote:
        status === "rejected" ? "Bukti transfer tidak dapat diverifikasi." : null,
      proofUrl: hasProof ? `https://picsum.photos/seed/bukti-${index}/600/900` : null,
      proofNote: hasProof ? "Transfer dari BCA a.n. donatur." : null,
      confirmedAt: hasProof ? createdAt : null,
      isDuaHidden: status === "verified" && random() < 0.04,
      createdAt,
    })
  }

  await prisma.donation.createMany({ data: donations })

  // `raisedAmount` tracks verified funds only — recompute it from what was just
  // inserted so the seeded totals agree with the verification endpoint's maths.
  const verifiedTotals = await prisma.donation.groupBy({
    by: ["campaignId"],
    where: { campaignId: { in: campaignIds }, status: "verified" },
    _sum: { amount: true },
  })

  await prisma.campaign.updateMany({
    where: { id: { in: campaignIds } },
    data: { raisedAmount: 0n },
  })

  for (const total of verifiedTotals) {
    await prisma.campaign.update({
      where: { id: total.campaignId },
      data: { raisedAmount: total._sum.amount ?? 0n },
    })
  }

  const pendingCount = donations.filter((row) => row.status === "pending").length

  console.log("✅ Seed completed.")
  console.log("")
  console.log("Created:")
  console.log(`- Roles: ${superAdminRole.name}, ${adminRole.name}, ${financeRole.name}`)
  console.log(`- Admins: 4 (login ${superAdmin.email} / ${SEED_PASSWORD})`)
  console.log(`- Users: ${users.length}`)
  console.log("- Fundraisers: 3")
  console.log(`- Campaigns: ${campaigns.length} (4 active, 1 completed, 1 draft)`)
  console.log("- Campaign updates: 6")
  console.log(`- Donations: ${donations.length} (${pendingCount} awaiting verification)`)
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:")
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
