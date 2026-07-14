// ============================================================================
// Backend API response shapes (mirror of the REST API envelopes).
// Kept separate from UI types so the UI never depends on storage internals.
// ============================================================================

export interface ApiArtist {
  id: string;
  name: string;
  avatar: string | null;
  role: "ADMIN" | "ARTIST" | "CUSTOMER";
  _count?: { artworks: number };
}

export interface ApiCategoryRef {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface ApiArtwork {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image: string;
  images: string[];
  price: number;
  medium: string | null;
  width: number | null;
  height: number | null;
  year: number | null;
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" | "SOLD" | "ARCHIVED";
  availability: string | null;
  views: number;
  favoritesCount: number;
  likesCount: number;
  isFeatured: boolean;
  artist: ApiArtist;
  category: ApiCategoryRef | null;
  createdAt: string;
  updatedAt: string;
  _count?: { favorites: number; likes: number; reviews: number };
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "ADMIN" | "ARTIST" | "CUSTOMER";
  verified: boolean;
  bio: string | null;
  // Artist contact information (returned to the owner / dashboard only).
  phone: string | null;
  facebook: string | null;
  instagram: string | null;
  telegram: string | null;
  whatsapp: string | null;
  location: string | null;
  preferredContactMethod:
    | "PHONE"
    | "EMAIL"
    | "FACEBOOK"
    | "INSTAGRAM"
    | "TELEGRAM"
    | "WHATSAPP"
    | null;
  responseTime: string | null;
  showPhone: boolean;
  showEmail: boolean;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public artist profile returned by GET /api/artists/:id. Sensitive fields
 * (phone/email) are omitted unless the artist enabled their visibility toggle.
 */
export interface ApiArtistProfile {
  id: string;
  name: string;
  avatar: string | null;
  role: "ADMIN" | "ARTIST" | "CUSTOMER";
  verified: boolean;
  bio: string | null;
  location: string | null;
  responseTime: string | null;
  preferredContactMethod:
    | "PHONE"
    | "EMAIL"
    | "FACEBOOK"
    | "INSTAGRAM"
    | "TELEGRAM"
    | "WHATSAPP"
    | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  telegram: string | null;
  facebook: string | null;
  instagram: string | null;
  _count?: { artworks: number };
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  _count?: { artworks: number };
}

export interface ApiCollection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  _count?: { artworks: number };
}

export interface ApiOrderItem {
  id: string;
  title: string;
  image: string | null;
  price: number;
  quantity: number;
}

export interface ApiOrder {
  id: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: ApiOrderItem[];
  user?: { id: string; name: string; email: string; avatar: string | null };
}

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  relatedId: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

// Editable site content (logo, artist photo, about page) — admin managed.
export interface ApiSiteStat {
  value: string;
  label: string;
  icon: string;
}

export interface ApiSiteSocial {
  label: string;
  href: string;
}

export interface ApiSiteContact {
  email: string;
  studio: string;
  hours: string;
  socials: ApiSiteSocial[];
}

export interface ApiSiteSettings {
  logoText: string;
  logoImage: string;
  artistPhoto: string;
  aboutName: string;
  aboutSubtitle: string;
  aboutBio: string;
  aboutStats: ApiSiteStat[];
  contact: ApiSiteContact;
}

export interface ApiSiteHeroSettings {
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroCaption: string;
}

export interface ApiArtistAnalytics {
  artworks: number;
  viewsLast30: number;
  revenueLast30: number;
  totalSalesValue: number;
}

// Purchase request (public request to purchase an artwork, offline flow).
export interface ApiPurchaseRequest {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  message: string | null;
  status: "NEW" | "CONTACTED" | "RESERVED" | "SOLD" | "CANCELLED";
  artworkId: string;
  artistId: string;
  artwork?: { id: string; title: string; image: string };
  createdAt: string;
  updatedAt: string;
}

export interface ApiPurchaseRequestList {
  items: ApiPurchaseRequest[];
  meta: PaginationMeta;
}

export interface ApiContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  body: string;
  createdAt: string;
}

export interface ApiContactMessageList {
  items: ApiContactMessage[];
  meta: PaginationMeta;
}
