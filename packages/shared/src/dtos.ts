import type { Enums, Tables } from './database';

export type Profile = Tables<'profiles'>;
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

export type PartyProfile = Pick<
  Profile,
  'id' | 'full_name' | 'avatar_url' | 'phone' | 'client_rating'
>;

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
  distance_km: number;
  lat: number;
  lng: number;
};

export type ProviderReview = Review & {
  reviewer: Pick<Profile, 'full_name' | 'avatar_url'> | null;
};

export type ProviderDetail = {
  profile: Profile;
  practitioner: PractitionerProfile;
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
  address: string | null;
  scheduled_at: string | null;
  budget_min: number | null;
  budget_max: number | null;
  image_url: string | null;
  expires_at: string;
  distance_km: number;
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
