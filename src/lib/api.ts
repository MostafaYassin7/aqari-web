import type { Listing, SearchResponse } from '@/types/listing';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.aqora.sa/api/v1';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('aqar-auth');
    if (!raw) return null;
    return JSON.parse(raw)?.state?.token ?? null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Something went wrong');
  }

  return json.data as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHit(hit: any): Listing {
  return {
    id: hit.objectID ?? hit.id ?? '',
    title: hit.title ?? '',
    description: hit.description,
    price: String(hit.totalPrice ?? hit.price ?? 0),
    area: hit.area ? parseFloat(hit.area) : undefined,
    bedrooms: hit.bedrooms,
    bathrooms: hit.bathrooms,
    livingRooms: hit.livingRooms,
    city: hit.city ?? '',
    district: hit.district !== 'string' ? hit.district : undefined,
    category: hit.categoryName ?? hit.category ?? '',
    listingType: hit.listingType ?? '',
    propertyType: hit.propertyType,
    coverPhoto: hit.coverPhoto,
    photos: hit.photos,
    isGolden: hit.isGolden ?? false,
    isPromoted: hit.isPromoted ?? false,
    adNumber: hit.adNumber,
    pricePerMeter: hit.pricePerMeter ? String(hit.pricePerMeter) : undefined,
    createdAt: hit.createdAt ? new Date(hit.createdAt * 1000).toISOString() : undefined,
    maxGuests: hit.maxGuests,
    pricePerHalfDay: hit.pricePerHalfDay != null ? String(hit.pricePerHalfDay) : undefined,
    lat: hit._geoloc?.lat,
    lng: hit._geoloc?.lng,
    owner: {
      id: hit.ownerId ?? '',
      name: hit.ownerName,
      photo: hit.ownerPhoto,
      phone: hit.ownerPhone,
      rating: hit.ownerRating,
      reviewCount: hit.ownerReviewCount,
    },
    features: {
      furnished: hit.isFurnished,
      elevator: hit.hasElevator,
      water: hit.hasWater,
      electricity: hit.hasElectricity,
      parking: hit.hasParking,
      pool: hit.hasPool,
      gym: hit.hasGym,
      ac: hit.hasAC,
      kitchen: hit.hasKitchen,
    },
  };
}

export async function searchListings(
  params: Record<string, string | number | undefined>
): Promise<SearchResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.set(k, String(v));
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await apiRequest<any>(`/search?${query}`);

  const hits = data.hits ?? data.listings ?? data.results ?? data.data ?? [];
  const total = data.nbHits ?? data.total ?? hits.length;
  const pages = data.nbPages ?? data.totalPages ?? data.pages ?? Math.ceil(total / (Number(params.limit) || 12));
  const page = data.page ?? (Number(params.page) || 1);

  return {
    listings: hits.map(mapHit),
    total,
    page,
    totalPages: pages,
  };
}

export async function getListing(id: string): Promise<Listing> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await apiRequest<any>(`/listings/${id}`);
  if (data.objectID || data.totalPrice !== undefined) return mapHit(data);
  return {
    ...data,
    price: String(data.price ?? data.totalPrice ?? 0),
  } as Listing;
}

export async function getListings(params: {
  page?: number;
  limit?: number;
  city?: string;
  categoryId?: string;
  listingType?: string;
  propertyType?: string;
  status?: string;
}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v != null && v !== '')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(([k, v]) => [k, String(v as any)])
  ).toString();
  return apiRequest<{ data: unknown[]; total: number; page: number; pages: number }>(
    `/listings?${query}`
  );
}

export async function getGoldenListings() {
  return apiRequest<unknown[]>('/listings/golden');
}

export async function getCategories() {
  return apiRequest<{
    id: string;
    name: string;
    nameAr: string;
    propertyType: string;
    listingType: string;
    sortOrder: number;
  }[]>('/listing-categories');
}

export async function geoSearch(params: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  listingType?: string;
  propertyType?: string;
}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v != null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(([k, v]) => [k, String(v as any)])
  ).toString();
  return apiRequest<{ hits: unknown[]; total: number }>(`/search/geo?${query}`);
}

export async function toggleFavorite(
  targetType: 'listing' | 'project',
  targetId: string
) {
  return apiRequest<{ isFavorited: boolean }>(
    '/engagement/favorites',
    { method: 'POST', body: JSON.stringify({ targetType, targetId }) },
    true
  );
}

export async function getSimilarListings(id: string) {
  return apiRequest<unknown[]>(`/listings/${id}/similar`);
}

export async function startChat(data: { participantId: string; listingId?: string }) {
  return apiRequest<{ id: string }>(
    '/chats',
    { method: 'POST', body: JSON.stringify(data) },
    true
  );
}

export async function getMyListings(params?: { status?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams(
    Object.entries(params ?? {})
      .filter(([, v]) => v != null && v !== '')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(([k, v]) => [k, String(v as any)])
  ).toString();
  return apiRequest<{ data: unknown[]; total: number; page: number; pages: number }>(
    `/listings/my${query ? `?${query}` : ''}`,
    {},
    true
  );
}

export async function patchListingStatus(id: string, status: string) {
  return apiRequest<{ status: string }>(
    `/listings/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    true
  );
}

export async function deleteListing(id: string) {
  return apiRequest<void>(`/listings/${id}`, { method: 'DELETE' }, true);
}

export async function getFavorites(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams({
    targetType: 'listing',
    ...(params ? Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) : {}),
  }).toString();
  return apiRequest<{ data: unknown[]; total: number; page: number; pages: number }>(
    `/engagement/favorites?${query}`,
    {},
    true
  );
}

export async function getChats() {
  return apiRequest<{
    id: string;
    listingId: string | null;
    lastMessage: string | null;
    lastMessageAt: string | null;
    otherParticipant: { id: string; name: string | null; profilePhoto: string | null; phone: string };
    unreadCount: number;
    listing?: { id: string; title: string; coverPhoto: string | null; adNumber: string };
  }[]>('/chats', {}, true);
}

export async function getChatMessages(chatId: string, page = 1, limit = 50) {
  return apiRequest<{
    data: { id: string; chatId: string; senderId: string; content: string; isRead: boolean; readAt: string | null; createdAt: string }[];
    total: number;
    page: number;
  }>(`/chats/${chatId}/messages?page=${page}&limit=${limit}`, {}, true);
}

export async function createOrFindChat(participantId: string, listingId?: string) {
  return apiRequest<{ id: string }>(
    '/chats',
    { method: 'POST', body: JSON.stringify(listingId ? { participantId, listingId } : { participantId }) },
    true
  );
}

export async function markChatRead(chatId: string) {
  return apiRequest<void>(`/chats/${chatId}/read`, { method: 'PATCH' }, true);
}

export async function submitLicense(data: Record<string, unknown>) {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v != null && v !== ''));
  return apiRequest<{ id: string }>(
    '/property-advertisement-licenses',
    { method: 'POST', body: JSON.stringify(clean) },
    true
  );
}

export async function getWallet() {
  return apiRequest<{
    id: string;
    userId: string;
    balance: string;
    heldBalance?: string;
    pendingEarnings?: string;
    currency: string;
  }>(
    '/wallet',
    {},
    true
  );
}

export async function getTransactions(params: {
  page?: number;
  limit?: number;
  referenceType?: string;
}) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v != null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(([k, v]) => [k, String(v as any)])
  ).toString();
  return apiRequest<{ data: unknown[]; total: number; page: number; pages: number }>(
    `/wallet/transactions?${query}`,
    {},
    true
  );
}

export async function initiatePaymentSession(amount: number): Promise<{ sessionId: string; countryCode: string }> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/payment/initiate-session`, {
    method: 'POST', headers,
    body: JSON.stringify({ invoiceAmount: amount }),
  });
  const json = await res.json();
  const mf = json.data ?? json; // global interceptor wraps in { data, message }
  if (!res.ok || mf.IsSuccess === false) throw new Error(mf.Message || 'فشل إنشاء جلسة الدفع');
  return { sessionId: mf.Data.SessionId as string, countryCode: (mf.Data.CountryCode ?? 'KWT') as string };
}

export async function executePayment(sessionId: string, invoiceValue: number): Promise<{
  id: string; paymentStatus: string; paymentURL: string | null; invoiceId: string;
}> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/payment/execute`, {
    method: 'POST', headers,
    body: JSON.stringify({ sessionId, invoiceValue }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || json.Message || 'فشل تنفيذ الدفع');
  return json.data ?? json; // unwrap interceptor envelope
}

export async function createListing(data: Record<string, unknown>) {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v != null));
  return apiRequest<{ id: string }>(
    '/listings',
    { method: 'POST', body: JSON.stringify(clean) },
    true
  );
}

export async function uploadMedia(files: File[], folder = 'listings'): Promise<string[]> {
  const token = getToken();
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  formData.append('folder', folder);

  const res = await fetch(`${BASE_URL}/media/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) throw new Error(json.message || 'Upload failed');

  // Handle various response shapes
  const d = json.data;
  if (Array.isArray(d)) return d.map((item: { url?: string } | string) => (typeof item === 'string' ? item : item?.url ?? ''));
  if (d?.urls) return d.urls;
  if (d?.url) return [d.url];
  return [];
}

export async function validateBrokerLicense(data: {
  adLicenseNumber: string;
  ownerIdType: string;
  ownerIdNumber: string;
}) {
  return apiRequest<{ isValid: boolean; licenseId?: string }>(
    '/property-advertisement-licenses/validate-broker',
    { method: 'POST', body: JSON.stringify(data) },
    true
  );
}

export async function validateHostLicense(tourismLicenseNumber: string) {
  return apiRequest<{ isValid: boolean; licenseId?: string }>(
    '/property-advertisement-licenses/validate-host',
    { method: 'POST', body: JSON.stringify({ tourismLicenseNumber }) },
    true
  );
}

export async function getListingCalendar(
  listingId: string,
  year: number,
  month: number,
): Promise<{
  blockedDates: { date: string; timeSlot: string | null }[];
}> {
  return apiRequest<{
    blockedDates: { date: string; timeSlot: string | null }[];
  }>(`/listings/${listingId}/calendar?year=${year}&month=${month}`);
}

export async function checkAvailability(
  listingId: string,
  params: {
    checkInDate: string;
    checkOutDate: string;
  },
): Promise<{
  isAvailable: boolean;
  blockedDates?: string[];
}> {
  return apiRequest<{
    isAvailable: boolean;
    blockedDates?: string[];
  }>(
    `/bookings/check-availability/${listingId}`,
    { method: 'POST', body: JSON.stringify(params) },
  );
}

export async function createBooking(params: {
  listingId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount?: number;
  notes?: string;
}) {
  return apiRequest<{
    id: string;
    status: string;
    totalPrice: string;
    nights: number;
  }>(
    '/bookings',
    { method: 'POST', body: JSON.stringify(params) },
    true,
  );
}

export async function getMyBookingsAsGuest(
  page = 1, limit = 20,
) {
  return apiRequest<{
    data: any[];
    total: number;
    pages: number;
  }>(
    `/bookings/my/guest?page=${page}&limit=${limit}`,
    {}, true,
  );
}

export async function getMyBookingsAsOwner(
  page = 1, limit = 20,
) {
  return apiRequest<{
    data: any[];
    total: number;
    pages: number;
  }>(
    `/bookings/my/owner?page=${page}&limit=${limit}`,
    {}, true,
  );
}

export async function confirmBooking(bookingId: string) {
  return apiRequest<{ status: string }>(
    `/bookings/${bookingId}/confirm`,
    { method: 'PATCH' },
    true,
  );
}

export async function declineBooking(
  bookingId: string,
  reason?: string,
) {
  return apiRequest<{ status: string }>(
    `/bookings/${bookingId}/decline`,
    {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    },
    true,
  );
}

export async function cancelBooking(bookingId: string) {
  return apiRequest<{ status: string }>(
    `/bookings/${bookingId}/cancel`,
    { method: 'PATCH' },
    true,
  );
}
