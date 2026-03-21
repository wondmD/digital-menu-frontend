export const MOCK_HOTELS = [
  {
    id: "h1",
    name: "The Golden Leaf Café",
    logo: "/cafe-logo.png",
    description: "A cozy spot for artisanal coffee and gourmet pastries.",
    address: "123 Serene Avenue, Garden District",
    phone: "+1 (555) 123-4567",
    slug: "golden-leaf",
    socials: {
      instagram: "goldenleafcafe",
      facebook: "goldenleafcafe",
    },
  },
  {
    id: "h2",
    name: "Harborview Hotel",
    logo: "/placeholder-logo.png",
    description: "Waterfront dining with panoramic harbor views and seasonal seafood.",
    address: "9 Oceanfront Blvd, Harbor City",
    phone: "+1 (555) 234-7890",
    slug: "harborview",
    socials: {
      instagram: "harborviewhotel",
      facebook: "harborviewhotel",
    },
  },
  {
    id: "h3",
    name: "Summit Rooftop",
    logo: "/placeholder-logo.svg",
    description: "Sky-high cocktails and tapas with a skyline backdrop.",
    address: "77 Peak Street, Downtown",
    phone: "+1 (555) 987-6543",
    slug: "summit-rooftop",
    socials: {
      instagram: "summitrooftop",
      facebook: "summitrooftop",
    },
  },
]

export const MOCK_HOTEL = MOCK_HOTELS[0]

export const MOCK_MENUS = [
  {
    id: "menu-1",
    name: "Golden Leaf Café",
    slug: "golden-leaf",
    location: "Garden District",
    status: "Live",
    scans30d: 1248,
  },
  {
    id: "menu-2",
    name: "Harborview Hotel",
    slug: "harborview",
    location: "Waterfront",
    status: "Live",
    scans30d: 932,
  },
  {
    id: "menu-3",
    name: "Summit Rooftop",
    slug: "summit-rooftop",
    location: "Downtown",
    status: "Draft",
    scans30d: 187,
  },
]

export const MOCK_CATEGORIES = [
  { id: "c1", name: "Hot Coffee", itemCount: 8 },
  { id: "c2", name: "Iced Drinks", itemCount: 5 },
  { id: "c3", name: "Gourmet Pastries", itemCount: 6 },
  { id: "c4", name: "Breakfast Plates", itemCount: 4 },
  { id: "c5", name: "Fresh Juices", itemCount: 3 },
]

export const MOCK_MENU_ITEMS = [
  {
    id: "m1",
    menuId: "menu-1",
    categoryId: "c1",
    name: "Classic Espresso",
    description: "Rich and bold single shot of our signature house blend.",
    price: 3.5,
    image: "/espresso-shot.png",
    available: true,
  },
  {
    id: "m2",
    menuId: "menu-1",
    categoryId: "c1",
    name: "Caramel Macchiato",
    description:
      "Freshly steamed milk with vanilla-flavored syrup marked with espresso and topped with caramel drizzle.",
    price: 5.25,
    image: "/macchiato.jpg",
    available: true,
  },
  {
    id: "m3",
    menuId: "menu-1",
    categoryId: "c3",
    name: "Butter Croissant",
    description: "Flaky, golden-brown pastry made with real French butter.",
    price: 3.75,
    image: "/golden-croissant.png",
    available: true,
  },
  {
    id: "m4",
    menuId: "menu-1",
    categoryId: "c2",
    name: "Passion Fruit Iced Tea",
    description: "Refreshing black tea infused with tropical passion fruit flavors.",
    price: 4.5,
    image: "/iced-tea.png",
    available: false,
  },
  {
    id: "m5",
    menuId: "menu-2",
    categoryId: "c4",
    name: "Seaside Brunch Platter",
    description: "Smoked salmon, poached eggs, and lemon-dill hollandaise with greens.",
    price: 16.5,
    image: "/placeholder.jpg",
    available: true,
  },
  {
    id: "m6",
    menuId: "menu-2",
    categoryId: "c5",
    name: "Citrus Sunrise Juice",
    description: "Fresh orange, grapefruit, and mint over crushed ice.",
    price: 6.0,
    image: "/glass-of-orange-juice.png",
    available: true,
  },
  {
    id: "m7",
    menuId: "menu-3",
    categoryId: "c2",
    name: "Cold Brew Tonic",
    description: "Bright espresso cold brew over tonic with a grapefruit twist.",
    price: 5.75,
    image: "/placeholder.svg",
    available: true,
  },
  {
    id: "m8",
    menuId: "menu-3",
    categoryId: "c3",
    name: "Midnight Lava Cake",
    description: "Decadent dark chocolate cake with molten center and vanilla bean gelato.",
    price: 8.25,
    image: "/decadent-lava-cake.png",
    available: true,
  },
]

export type PartnerLevel = "Starter" | "Pro" | "Elite"

export type PartnerProfile = {
  id: string
  fullName: string
  email: string
  company?: string
  joinedAt: string
}

export type ReferralStatus = "pending" | "active" | "churned"
export type PaymentStatus = "paid" | "pending"

export type PartnerReferral = {
  id: string
  restaurantName: string
  status: ReferralStatus
  joinedAt: string
  subscriptionStatus: "trial" | "active" | "past_due" | "canceled"
}

export type PartnerCommission = {
  id: string
  restaurantName: string
  firstPaymentCommission: number
  recurringCommission: number
  status: PaymentStatus
  paidAt?: string
}

export type PartnerAnalyticsPoint = {
  month: string
  signups: number
  conversions: number
}

export type PartnerNotification = {
  id: string
  title: string
  description: string
  createdAt: string
  kind: "signup" | "commission" | "system"
}

export type PartnerChecklistItem = {
  id: string
  title: string
  completed: boolean
}

export type ToolkitAsset = {
  id: string
  title: string
  type: "pdf" | "video" | "text"
  url: string
  description: string
}

export const MOCK_PARTNER_PROFILE: PartnerProfile = {
  id: "partner_9fd2",
  fullName: "Selam Marketing Group",
  email: "partners@selamgrowth.com",
  company: "Selam Growth",
  joinedAt: "2025-05-02T09:15:00.000Z",
}

export const MOCK_PARTNER_REFERRALS: PartnerReferral[] = [
  {
    id: "ref_001",
    restaurantName: "Buna Corner",
    status: "active",
    joinedAt: "2025-12-10T11:25:00.000Z",
    subscriptionStatus: "active",
  },
  {
    id: "ref_002",
    restaurantName: "Lalibela Bites",
    status: "pending",
    joinedAt: "2026-01-13T10:05:00.000Z",
    subscriptionStatus: "trial",
  },
  {
    id: "ref_003",
    restaurantName: "Skyline Grill",
    status: "active",
    joinedAt: "2025-11-22T16:30:00.000Z",
    subscriptionStatus: "active",
  },
  {
    id: "ref_004",
    restaurantName: "Riverside Dine",
    status: "churned",
    joinedAt: "2025-09-04T08:00:00.000Z",
    subscriptionStatus: "canceled",
  },
  {
    id: "ref_005",
    restaurantName: "Megenagna Kitchen",
    status: "active",
    joinedAt: "2026-02-05T13:45:00.000Z",
    subscriptionStatus: "active",
  },
]

export const MOCK_PARTNER_COMMISSIONS: PartnerCommission[] = [
  {
    id: "com_001",
    restaurantName: "Buna Corner",
    firstPaymentCommission: 320,
    recurringCommission: 48,
    status: "paid",
    paidAt: "2026-03-01T12:30:00.000Z",
  },
  {
    id: "com_002",
    restaurantName: "Skyline Grill",
    firstPaymentCommission: 360,
    recurringCommission: 54,
    status: "paid",
    paidAt: "2026-02-10T12:30:00.000Z",
  },
  {
    id: "com_003",
    restaurantName: "Megenagna Kitchen",
    firstPaymentCommission: 280,
    recurringCommission: 42,
    status: "pending",
  },
  {
    id: "com_004",
    restaurantName: "Lalibela Bites",
    firstPaymentCommission: 0,
    recurringCommission: 0,
    status: "pending",
  },
]

export const MOCK_PARTNER_ANALYTICS: PartnerAnalyticsPoint[] = [
  { month: "Oct", signups: 2, conversions: 1 },
  { month: "Nov", signups: 4, conversions: 3 },
  { month: "Dec", signups: 5, conversions: 3 },
  { month: "Jan", signups: 6, conversions: 4 },
  { month: "Feb", signups: 3, conversions: 2 },
  { month: "Mar", signups: 7, conversions: 5 },
]

export const MOCK_PARTNER_NOTIFICATIONS: PartnerNotification[] = [
  {
    id: "not_001",
    title: "New referral signup",
    description: "Lalibela Bites joined using your referral link.",
    createdAt: "2026-03-19T07:25:00.000Z",
    kind: "signup",
  },
  {
    id: "not_002",
    title: "Commission paid",
    description: "A payout of $414 was sent to your account.",
    createdAt: "2026-03-18T13:10:00.000Z",
    kind: "commission",
  },
  {
    id: "not_003",
    title: "Program update",
    description: "New WhatsApp scripts were added to the toolkit.",
    createdAt: "2026-03-15T09:45:00.000Z",
    kind: "system",
  },
]

export const MOCK_PARTNER_CHECKLIST: PartnerChecklistItem[] = [
  { id: "chk_1", title: "Complete partner profile", completed: true },
  { id: "chk_2", title: "Copy and share referral link", completed: true },
  { id: "chk_3", title: "Refer your first restaurant", completed: true },
  { id: "chk_4", title: "Book product walkthrough with lead", completed: false },
  { id: "chk_5", title: "Download marketing kit", completed: false },
]

export const MOCK_PARTNER_TOOLKIT: ToolkitAsset[] = [
  {
    id: "asset_1",
    title: "Pitch Deck",
    type: "pdf",
    url: "/assets/partner/pitch-deck.pdf",
    description: "Presentation deck explaining product, pricing, and partner value.",
  },
  {
    id: "asset_2",
    title: "Demo Video",
    type: "video",
    url: "/assets/partner/demo-video.mp4",
    description: "Short product walkthrough you can send to prospects.",
  },
  {
    id: "asset_3",
    title: "WhatsApp Scripts",
    type: "text",
    url: "/assets/partner/whatsapp-scripts.txt",
    description: "Ready-to-use scripts for first outreach and follow-ups.",
  },
]
