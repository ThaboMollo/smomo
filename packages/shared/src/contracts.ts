import { z } from 'zod';

/* ----------------------------- Enums ----------------------------- */
export const zServiceCategory = z.enum([
  'beautician',
  'hairdresser',
  'makeup_artist',
  'nail_technician',
  'tattoo_artist',
]);
export const zBookingMode = z.enum(['studio', 'mobile']);
export const zServiceMode = z.enum(['studio', 'mobile', 'both']);
export const zIdType = z.enum(['sa_id', 'passport']);

/* ----------------------------- Discovery ----------------------------- */
export const zSearchProvidersQuery = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  category: zServiceCategory.optional(),
  mode: zBookingMode.optional(),
  maxKm: z.coerce.number().positive().max(200).default(50),
});
export type SearchProvidersQuery = z.infer<typeof zSearchProvidersQuery>;

/* ----------------------------- Requests ----------------------------- */
export const zCreateRequest = z.object({
  category: zServiceCategory,
  bookingMode: zBookingMode,
  lat: z.number(),
  lng: z.number(),
  description: z.string().max(1000).optional(),
  address: z.string().max(300).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  budgetMin: z.number().nonnegative().nullable().optional(),
  budgetMax: z.number().nonnegative().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  targetPractitionerId: z.string().uuid().nullable().optional(),
  consent: z.boolean().default(false),
  expiresMinutes: z.number().int().positive().max(1440).default(30),
});
export type CreateRequestInput = z.infer<typeof zCreateRequest>;

/* ----------------------------- Offers ----------------------------- */
export const zMakeOffer = z.object({
  requestId: z.string().uuid(),
  price: z.number().positive(),
  message: z.string().max(500).optional(),
});
export type MakeOfferInput = z.infer<typeof zMakeOffer>;

/* ----------------------------- Payments ----------------------------- */
export const zMarkPaid = z.object({
  paymentId: z.string().uuid(),
  reference: z.string().min(1).max(120),
});
export type MarkPaidInput = z.infer<typeof zMarkPaid>;

export const zVerifyPayment = z.object({
  paymentId: z.string().uuid(),
  verified: z.boolean(),
  disputeReason: z.string().max(500).optional(),
});
export type VerifyPaymentInput = z.infer<typeof zVerifyPayment>;

/* ----------------------------- Bookings ----------------------------- */
export const zCancelBooking = z.object({ reason: z.string().max(500).default('') });
export type CancelBookingInput = z.infer<typeof zCancelBooking>;

export const zCompleteBooking = z.object({
  clientId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  proofImageUrl: z.string().url(),
});
export type CompleteBookingInput = z.infer<typeof zCompleteBooking>;

/* ----------------------------- Reviews ----------------------------- */
export const zClientReview = z.object({
  bookingId: z.string().uuid(),
  practitionerId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
export type ClientReviewInput = z.infer<typeof zClientReview>;

/* ----------------------------- Profile / identity ----------------------------- */
export const zUpdateProfile = z.object({
  first_name: z.string().max(80).optional(),
  last_name: z.string().max(80).optional(),
  full_name: z.string().max(160).optional(),
  phone: z.string().max(20).optional(),
  whatsapp_number: z.string().max(20).nullable().optional(),
  home_address: z.string().max(300).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof zUpdateProfile>;

export const zSubmitIdentity = z.object({
  idType: zIdType,
  idNumber: z.string().min(5).max(20),
  idCountry: z.string().max(60).nullable().optional(),
});
export type SubmitIdentityInput = z.infer<typeof zSubmitIdentity>;

/* ----------------------------- Practitioner ----------------------------- */
export const zSaveBusinessProfile = z.object({
  businessName: z.string().min(2).max(120),
  bio: z.string().max(1000).optional(),
  categories: z.array(zServiceCategory).min(1),
  yearsExperience: z.number().int().nonnegative().nullable().optional(),
  serviceMode: zServiceMode,
  travelRadiusKm: z.number().positive().max(200),
  requiresDeposit: z.boolean(),
  depositPercentage: z.number().int().min(0).max(100).nullable().optional(),
});
export type SaveBusinessProfileInput = z.infer<typeof zSaveBusinessProfile>;

export const zSetLocation = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().max(300).nullable().optional(),
});
export type SetLocationInput = z.infer<typeof zSetLocation>;

export const zSetPayshap = z.object({ payshapProxy: z.string().min(6).max(20) });

export const zSaveService = z.object({
  id: z.string().uuid().optional(),
  category: zServiceCategory,
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  indicativePrice: z.number().nonnegative().nullable().optional(),
  durationMinutes: z.number().int().positive().nullable().optional(),
});
export type SaveServiceInput = z.infer<typeof zSaveService>;

export const zAddPortfolioItem = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(300).optional(),
  category: zServiceCategory.nullable().optional(),
});
export type AddPortfolioItemInput = z.infer<typeof zAddPortfolioItem>;

/* ----------------------------- Reports ----------------------------- */
export const zCreateReport = z.object({
  reportedUserId: z.string().uuid(),
  bookingId: z.string().uuid().nullable().optional(),
  reason: z.string().min(1).max(120),
  details: z.string().max(1000).optional(),
});
export type CreateReportInput = z.infer<typeof zCreateReport>;

/* ----------------------------- Pagination ----------------------------- */
export const zPagination = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});
export type Pagination = z.infer<typeof zPagination>;
