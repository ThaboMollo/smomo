import type { Enums, Tables } from './database';

export type Profile = Tables<'profiles'>;
export type ProfileContact = Tables<'profile_contact'>;
// `Tables<>` covers views as well as tables in the current generator output, which no
// longer emits a separate `Views<>` helper.
export type PractitionerDirectoryRow = Tables<'practitioner_directory'>;

/** A provider's social handles, keyed by platform. Replaces the four columns. */
export type SocialHandles = Partial<Record<Enums<'social_platform'>, string>>;
export type Booking = Tables<'bookings'>;
export type Payment = Tables<'payments'>;
export type Review = Tables<'reviews'>;
export type Message = Tables<'messages'>;
export type BookingRequest = Tables<'booking_requests'>;
export type RequestOffer = Tables<'request_offers'>;
export type Service = Tables<'services'>;
export type PortfolioItem = Tables<'portfolio_items'>;
export type PractitionerProfile = Tables<'practitioner_profiles'>;
export type Subscription = Tables<'subscriptions'>;

/**
 * What `GET /me` returns.
 *
 * Migrations 04 and 05 moved contact details, payout details, categories and social
 * handles into row-secured side tables, and migration 10 dropped the originals. The API
 * re-flattens them back onto these two objects so screens keep reading `profile.phone`
 * and `practitioner.categories` — see `apps/api/src/modules/me.ts`.
 *
 * The generated table types cannot describe that composition, and until now each app
 * papered over it: `api-client` typed `practitioner` as `unknown`, and the mobile app
 * typed these as the bare `Tables<>` rows, which quietly claimed fields that are no
 * longer columns. Written down once here instead.
 */
export type MeProfile = Profile & {
  phone: string | null;
  whatsapp_number: string | null;
  home_address: string | null;
};

export type MePractitioner = PractitionerProfile & {
  payshap_proxy: string | null;
  categories: Enums<'service_category'>[];
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  x_handle: string | null;
};

export type Me = {
  profile: MeProfile | null;
  practitioner: MePractitioner | null;
  subscription: Subscription | null;
};

/**
 * The public half of a booking party. Phone deliberately absent: it moved to
 * profile_contact (migration 04) and now arrives via `BookingDetail.counterparty`,
 * which the database authorises per booking.
 */
export type PartyProfile = Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'client_rating'>;

/** The other side of a booking, with the contact details only a party may see. */
export type BookingCounterparty = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
};

/** Row shape returned by the search_providers RPC / providers search endpoint. */
export type ProviderCard = {
  id: string;
  business_name: string | null;
  avatar_url: string | null;
  categories: Enums<'service_category'>[];
  service_mode: Enums<'service_mode'>;
  rating: number | null;
  rating_count: number;
  jobs_done: number;
  verification_status: Enums<'verification_status'>;
  is_online: boolean;
  min_price: number | null;
  /** Null when either side has no coordinates — match was by city. Hide distance then. */
  distance_km: number | null;
  lat: number | null;
  lng: number | null;
};

export type ProviderReview = Review & {
  reviewer: Pick<Profile, 'full_name' | 'avatar_url'> | null;
};

export type ProviderDetail = {
  profile: Profile;
  /**
   * Read from the practitioner_directory view (migration 05), so `categories`
   * and `socials` come from the 4NF tables and payout details are absent by
   * construction. The PayShap proxy arrives via `BookingDetail.payshapProxy`.
   */
  practitioner: PractitionerDirectoryRow;
  services: Service[];
  portfolio: PortfolioItem[];
  reviews: ProviderReview[];
};

export type OfferWithProvider = RequestOffer & {
  provider: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
  practitioner: Pick<
    PractitionerProfile,
    'business_name' | 'rating' | 'rating_count' | 'jobs_done' | 'verification_status'
  > | null;
};

export type RequestWithOffers = {
  request: BookingRequest | null;
  offers: OfferWithProvider[];
};

export type BookingWithParties = Booking & {
  client: PartyProfile | null;
  practitioner: PartyProfile | null;
};

export type BookingDetail = {
  booking: BookingWithParties;
  payments: Payment[];
  reviews: Review[];
  /** The other party's contact details. Null when the caller is not a party. */
  counterparty: BookingCounterparty | null;
  /** Where to pay the practitioner. Null unless the caller is the client/practitioner. */
  payshapProxy: string | null;
};

/** Row shape returned by feed_requests_for_practitioner. */
export type FeedRequest = {
  request_id: string;
  client_id: string;
  client_name: string | null;
  client_rating: number | null;
  category: Enums<'service_category'>;
  description: string | null;
  booking_mode: Enums<'booking_mode'>;
  /**
   * The town only. The client's street address is deliberately NOT in the feed — a
   * practitioner gets it from the booking once the client accepts (migration 16).
   */
  city: string | null;
  scheduled_at: string | null;
  budget_min: number | null;
  budget_max: number | null;
  image_url: string | null;
  expires_at: string;
  /** Null when either side has no coordinates — matched by city. */
  distance_km: number | null;
  has_offered: boolean;
  created_at: string;
};

/** Public (unauthenticated) SEO shapes. */
export type PublicProvider = {
  id: string;
  slug: string;
  business_name: string | null;
  bio: string | null;
  categories: Enums<'service_category'>[];
  service_mode: Enums<'service_mode'>;
  rating: number | null;
  rating_count: number;
  jobs_done: number;
  base_address: string | null;
  avatar_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  x_handle: string | null;
  services: Pick<Service, 'id' | 'category' | 'title' | 'description' | 'indicative_price_zar'>[];
  portfolio: Pick<PortfolioItem, 'id' | 'image_url' | 'caption' | 'category'>[];
  reviews: { rating: number; comment: string | null; created_at: string; reviewer_name: string | null }[];
};

export type PublicProviderListItem = {
  id: string;
  slug: string;
  business_name: string | null;
  categories: Enums<'service_category'>[];
  rating: number | null;
  rating_count: number;
  jobs_done: number;
  avatar_url: string | null;
  min_price: number | null;
};

export type Paginated<T> = { items: T[]; total: number; limit: number; offset: number };
