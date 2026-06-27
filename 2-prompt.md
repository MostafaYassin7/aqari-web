[PASTE SESSION HEADER ABOVE FIRST]

Enhance existing pages and add map view
and daily rents to the Aqar Next.js web app.

Install:
  npm install @react-google-maps/api

─── STEP 1: UPDATE API CLIENT FOR LISTINGS ──────────────────

Update src/lib/api.ts to add these functions:

export async function getListings(params: {
  page?: number;
  limit?: number;
  city?: string;
  categoryId?: string;
  listingType?: string;
  propertyType?: string;
  status?: string;
}) {
  // GET /listings
  // Returns: { data: ListingCard[], total, page, pages }
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return apiRequest<{
    data: any[];
    total: number;
    page: number;
    pages: number;
  }>(`/listings?${query}`);
}

export async function getGoldenListings() {
  return apiRequest<any[]>('/listings/golden');
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
  // GET /search/geo
  // Returns Algolia hits with objectID and _geoloc
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return apiRequest<{ hits: any[]; total: number }>(
    `/search/geo?${query}`
  );
}

export async function toggleFavorite(
  targetType: 'listing' | 'project',
  targetId: string
) {
  // POST /engagement/favorites
  // Returns: { isFavorited: boolean }
  return apiRequest<{ isFavorited: boolean }>(
    '/engagement/favorites',
    {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId }),
    },
    true // requires auth
  );
}

export async function getSimilarListings(id: string) {
  return apiRequest<any[]>(`/listings/${id}/similar`);
}

─── STEP 2: LISTING CARD COMPONENT ──────────────────────────

Create src/components/listings/ListingCard.tsx:

Used on ALL pages that show listings.

Props:
  listing: {
    id: string;
    adNumber: string;
    title: string;
    city: string;
    totalPrice: string; // parseFloat before display
    area: string;       // parseFloat before display
    bedrooms: number | null;
    bathrooms: number | null;
    listingType: string;
    propertyType: string;
    coverPhoto: string | null;
    isPromoted: boolean;
    isGolden: boolean;
    categoryName?: string;
  }
  showFavorite?: boolean; // default true

Display:
  Cover photo (aspect-ratio 4/3, rounded-xl)
    If no photo: grey placeholder with house icon
  Golden badge (top-left if isGolden):
    "ذهبي" gold pill badge
  Featured badge (top-left if isPromoted && !isGolden):
    "مميز" orange pill badge
  Favorite button (top-right, heart icon):
    Only if showFavorite && user is logged in
    Red filled if favorited, grey outline if not
    On click: toggleFavorite('listing', id)

Below photo:
  City + listingType badge
  Title (bold, 2 lines max, ellipsis)
  Price: formatPrice(parseFloat(totalPrice)) SAR
  Stats row: area m² · bedrooms · bathrooms

Price formatting:
  750000 → "750,000 SAR"
  1500000 → "1.5M SAR"
  Use Intl.NumberFormat for comma formatting

─── STEP 3: ENHANCE /listings PAGE ──────────────────────────

Update existing /listings page.

Current state: basic search exists using searchListings()
Enhancement: complete filter panel + list/map toggle

Add filter sidebar (desktop) / filter sheet (mobile):

  نوع الإعلان (tabs at top of results):
    الكل | للبيع (sale) | للإيجار (rent_long)

  الفلاتر section:
    المدينة: text input
    نوع العقار: multi-select chips
      شقة(apartment) | فيلا(villa) | أرض(land) |
      عمارة(building) | محل(shop) | بيت(house) |
      مستودع(warehouse) | مزرعة(farm) |
      استراحة(rest_house) | شاليه(chalet) |
      مكتب(commercial_office)
    نطاق السعر: two number inputs (من / إلى)
    المساحة: two number inputs م²
    غرف النوم: pills (أي | 1 | 2 | 3 | 4 | 5+)
    مزايا: checkboxes
      مفروش(isFurnished) | مصعد(hasElevator) |
      مياه(hasWater) | كهرباء(hasElectricity)

  Apply button → calls GET /search with all params
  Reset button → clears all params

List/Map toggle (top right of results):
  ☰ قائمة | 🗺 خريطة
  Switch between grid view and map view

Results grid:
  3 cols desktop / 2 cols tablet / 1 col mobile
  Uses ListingCard component
  Pagination at bottom

─── STEP 4: MAP VIEW COMPONENT ──────────────────────────────

Create src/components/map/ListingsMap.tsx:

'use client';
import { GoogleMap, useLoadScript, Marker,
         InfoWindow } from '@react-google-maps/api';

Props:
  listings: any[] // can be Algolia or PostgreSQL format
  onSearchArea?: (lat: number, lng: number) => void

Parse listings correctly:
  id: listing.id ?? listing.objectID
  lat: parseFloat(listing.latitude ?? listing._geoloc?.lat)
  lng: parseFloat(listing.longitude ?? listing._geoloc?.lng)
  price: parseFloat(listing.totalPrice)
  title: listing.title
  coverPhoto: listing.coverPhoto

Map config:
  defaultCenter: { lat: 24.7136, lng: 46.6753 }
    (Saudi Arabia center — Riyadh)
  defaultZoom: 6
  mapContainerStyle: { width: '100%', height: '100%' }
  options:
    disableDefaultUI: true
    zoomControl: true
    gestureHandling: 'greedy'

For each listing render a custom marker:
  Use Marker with label showing price
  Format: "750K" or "1.5M"
  On click → set selectedListing state

When selectedListing is set:
  Show InfoWindow at listing location:
    Cover photo (if exists)
    Title (bold)
    Price formatted
    City
    "عرض التفاصيل" button → /listings/:id
  Dismiss on InfoWindow close

Map drag/zoom end:
  Show "البحث في هذه المنطقة" button (centered, white pill)
  On click → get map center coords
            → call onSearchArea(lat, lng)
            → parent calls geoSearch()
            → update markers

─── STEP 5: ENHANCE /listings/[id] PAGE ─────────────────────

Update existing listing detail page.

Current state: shows listing data
Add:

1. Breadcrumb at top:
   الرئيسية > الإعلانات > [title]

2. Photo gallery:
   Parse from __media__ array:
     Sort by order field
     isCover first
   Main photo (full width, rounded-xl)
   Thumbnails row below (scrollable)
   Click thumbnail → swap main photo
   Click main photo → lightbox overlay
     Previous/Next navigation
     Close button

3. Favorite button (top-right of main photo):
   Heart icon — red if favorited, grey if not
   If not logged in → redirect to /login on click
   Call toggleFavorite('listing', id)

4. Owner card section:
   Data from __owner__: { name, phone, profilePhoto, role }
   Show: avatar, name, role badge, last active
   Role display:
     OWNER  → "مالك"
     BROKER → "وسيط عقاري"
     HOST   → "مضيف"

5. Contact bar (sticky bottom on mobile):
   WhatsApp button (green):
     Opens: https://wa.me/<phone>
     phone from __owner__.phone
   Chat button (#F5A623):
     If logged in → POST /chats first
                    { participantId: owner.id,
                      listingId: id }
                    Navigate to /dashboard/chat
     If not logged in → /login?redirect=/listings/:id

6. Stats row:
   From stats object:
     views: viewCount
     contacts: messageCount
     favorites: favoriteCount

7. Location map:
   Static GoogleMap embed
   Center: { lat: parseFloat(latitude),
             lng: parseFloat(longitude) }
   Zoom: 15
   Single marker at property location
   Non-interactive (no drag/zoom)

8. Similar listings:
   Title: "إعلانات مشابهة"
   Horizontal scroll row
   Call GET /listings/:id/similar
   Show 4 ListingCard components

─── STEP 6: DAILY RENTS PAGE ────────────────────────────────

Create src/app/[locale]/daily-rents/page.tsx:

Same layout as /listings but:
  Hardcoded: listingType = 'rent_short'
  All calls use GET /search with listingType=rent_short

Page header:
  Title: "الإيجار اليومي"
  Subtitle: "استأجر عقارك بشكل يومي"

Filter modifications:
  Remove "نوع الإعلان" tab (always rent_short)
  Change نوع العقار chips to daily-rent relevant:
    شقة | شاليه | استراحة | فيلا | بيت
  Change price label to "السعر الليلي"

Add to Navbar:
  "الإيجار اليومي" → /daily-rents

─── TEST ────────────────────────────────────────────────────

1. /listings → apply city filter → results update ✅
2. Toggle to map → pins appear ✅
3. Click pin → info card appears ✅
4. "البحث في هذه المنطقة" → new results ✅
5. /listings/:id → photos gallery works ✅
6. Favorite button → toggles ✅
7. WhatsApp button → opens wa.me link ✅
8. /daily-rents → only rent_short listings ✅