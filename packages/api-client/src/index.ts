import type {
  AddPortfolioItemInput,
  BookingDetail,
  BookingRequest,
  BookingWithParties,
  CancelBookingInput,
  ClientReviewInput,
  CompleteBookingInput,
  CreateReportInput,
  CreateRequestInput,
  Enums,
  FeedRequest,
  MakeOfferInput,
  MarkPaidInput,
  PortfolioItem,
  Profile,
  ProviderCard,
  ProviderDetail,
  PublicProvider,
  PublicProviderListItem,
  Paginated,
  RequestWithOffers,
  SaveBusinessProfileInput,
  SaveServiceInput,
  SearchProvidersQuery,
  Service,
  SetLocationInput,
  SubmitIdentityInput,
  UpdateProfileInput,
  VerifyPaymentInput,
} from '@smomo/shared';

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export type TokenProvider = () => Promise<string | null> | string | null;

export type ApiClientOptions = {
  /** API base including version, e.g. https://smomo-api.vercel.app/v1 */
  baseUrl: string;
  getToken?: TokenProvider;
};

type QueryValue = string | number | boolean | null | undefined;

function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return '';
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export function createApiClient(opts: ApiClientOptions) {
  const base = opts.baseUrl.replace(/\/$/, '');

  async function req<T>(
    method: string,
    path: string,
    options: { body?: unknown; auth?: boolean; query?: Record<string, QueryValue> } = {},
  ): Promise<T> {
    const { body, auth = true, query } = options;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth && opts.getToken) {
      const token = await opts.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(base + path + buildQuery(query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let parsed: any = undefined;
      try {
        parsed = await res.json();
      } catch {
        /* ignore */
      }
      const message = parsed?.message ?? parsed?.error ?? res.statusText;
      throw new ApiError(Array.isArray(message) ? message.join(', ') : String(message), res.status, parsed);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  return {
    request: req,

    providers: {
      search: (q: SearchProvidersQuery) =>
        req<ProviderCard[]>('GET', '/providers/search', { query: q as Record<string, QueryValue> }),
      get: (id: string) => req<ProviderDetail>('GET', `/providers/${id}`),
    },

    requests: {
      create: (input: CreateRequestInput) => req<{ id: string }>('POST', '/requests', { body: input }),
      mine: () => req<BookingRequest[]>('GET', '/requests/mine'),
      get: (id: string) => req<RequestWithOffers>('GET', `/requests/${id}`),
      cancel: (id: string) => req<void>('POST', `/requests/${id}/cancel`),
    },

    offers: {
      make: (input: MakeOfferInput) => req<{ id: string }>('POST', '/offers', { body: input }),
      accept: (offerId: string) => req<{ bookingId: string }>('POST', `/offers/${offerId}/accept`),
    },

    feed: {
      list: () => req<FeedRequest[]>('GET', '/practitioner/feed'),
    },

    bookings: {
      mine: (role: 'client' | 'practitioner') =>
        req<BookingWithParties[]>('GET', '/bookings', { query: { role } }),
      get: (id: string) => req<BookingDetail>('GET', `/bookings/${id}`),
      start: (id: string) => req<void>('POST', `/bookings/${id}/start`),
      complete: (id: string, input: CompleteBookingInput) =>
        req<void>('POST', `/bookings/${id}/complete`, { body: input }),
      cancel: (id: string, input: CancelBookingInput) =>
        req<void>('POST', `/bookings/${id}/cancel`, { body: input }),
    },

    payments: {
      markPaid: (input: MarkPaidInput) => req<void>('POST', '/payments/mark-paid', { body: input }),
      verify: (input: VerifyPaymentInput) => req<void>('POST', '/payments/verify', { body: input }),
    },

    reviews: {
      client: (input: ClientReviewInput) => req<void>('POST', '/reviews/client', { body: input }),
    },

    me: {
      get: () =>
        req<{ profile: Profile; practitioner: unknown; subscription: unknown }>('GET', '/me'),
      updateProfile: (input: UpdateProfileInput) => req<void>('PATCH', '/me', { body: input }),
      submitIdentity: (input: SubmitIdentityInput) => req<void>('POST', '/me/identity', { body: input }),
    },

    practitioner: {
      saveBusiness: (input: SaveBusinessProfileInput) =>
        req<void>('PUT', '/practitioner/profile', { body: input }),
      setLocation: (input: SetLocationInput) => req<void>('POST', '/practitioner/location', { body: input }),
      setPayshap: (payshapProxy: string) =>
        req<void>('POST', '/practitioner/payshap', { body: { payshapProxy } }),
      toggleOnline: (isOnline: boolean) =>
        req<void>('POST', '/practitioner/online', { body: { isOnline } }),
      finalize: (input: { payshapProxy: string; lat: number; lng: number; address?: string | null }) =>
        req<void>('POST', '/practitioner/finalize', { body: input }),
      listServices: (practitionerId: string) =>
        req<Service[]>('GET', `/practitioner/${practitionerId}/services`),
      saveService: (input: SaveServiceInput) => req<void>('POST', '/practitioner/services', { body: input }),
      deleteService: (id: string) => req<void>('DELETE', `/practitioner/services/${id}`),
      listPortfolio: (practitionerId: string) =>
        req<PortfolioItem[]>('GET', `/practitioner/${practitionerId}/portfolio`),
      addPortfolioItem: (input: AddPortfolioItemInput) =>
        req<void>('POST', '/practitioner/portfolio', { body: input }),
      deletePortfolioItem: (id: string) => req<void>('DELETE', `/practitioner/portfolio/${id}`),
    },

    reports: {
      create: (input: CreateReportInput) => req<void>('POST', '/reports', { body: input }),
    },

    admin: {
      reports: () => req<any[]>('GET', '/admin/reports'),
      resolveReport: (id: string, status: Enums<'report_status'>, resolution?: string) =>
        req<void>('POST', `/admin/reports/${id}/resolve`, { body: { status, resolution } }),
      disputes: () => req<any[]>('GET', '/admin/disputes'),
      resolveDispute: (paymentId: string, resolveAs: 'verified' | 'rejected') =>
        req<void>('POST', `/admin/disputes/${paymentId}/resolve`, { body: { resolveAs } }),
    },

    public: {
      provider: (slug: string) => req<PublicProvider>('GET', `/public/providers/${slug}`, { auth: false }),
      listing: (category: string, city: string, page?: { limit?: number; offset?: number }) =>
        req<Paginated<PublicProviderListItem>>('GET', `/public/${category}/${city}`, {
          auth: false,
          query: page,
        }),
      categoryHub: (category: string) =>
        req<Paginated<PublicProviderListItem>>('GET', `/public/${category}`, { auth: false }),
      cityHub: (city: string) =>
        req<Paginated<PublicProviderListItem>>('GET', `/public/city/${city}`, { auth: false }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
